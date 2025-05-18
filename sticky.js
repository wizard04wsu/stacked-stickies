import getRect from './getRect.js';

const STARTING_Z_INDEX = 1000;
const STICKY_CLASS_PREFIX = 'sticky';

const STICKY_CLASSES = `.${STICKY_CLASS_PREFIX}-top, .${STICKY_CLASS_PREFIX}-bottom`;

const zIndexes = {};
let resizeObserver;

const stickyElementsMap = new Map();
const containingBlocksMap = new Map();

document.addEventListener('DOMContentLoaded', () => {
	
	document.styleSheets[0].insertRule(`${STICKY_CLASSES} { position: sticky; }`, 0);
	document.styleSheets[0].insertRule(`.${STICKY_CLASS_PREFIX}-container { position: relative; overflow-y: auto; }`, 0);
	
	zIndexes.lower = window.parseInt(document.documentElement.dataset.stickyZIndex) || STARTING_Z_INDEX;
	zIndexes.mid = zIndexes.lower + 1;
	zIndexes.upper = zIndexes.lower + 2;
	
	resizeObserver = new ResizeObserver((entries) => updateOffsets());
	
	refreshStickyElements();
});

function refreshStickyElements() {
	// Refresh all sticky elements.
	
	resizeObserver.disconnect();
	
	stickyElementsMap?.keys().forEach((stickyElement) => {
		stickyElementsMap.get(stickyElement).intersectionObserver.disconnect();
	});
	
	stickyElementsMap.clear();
	
	const stickyElements = document.querySelectorAll(STICKY_CLASSES);
	
	// Map each containing block to an object with initial offset values.
	resetContainingBlocks(stickyElements);
	
	stickyElements.forEach((stickyElement) => {
		
		const containingBlock = getContainingBlock(stickyElement);
		
		const props = {
			element: stickyElement,
			container: containingBlock,
			sticksTo: {
				top: stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-top`),
				bottom: stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-bottom`),
			},
			offset: {
				top: 0,
				bottom: 0,
			},
		};
		props.zIndex = props.sticksTo.top ? zIndexes.upper : zIndexes.mid;
		
		stickyElementsMap.set(stickyElement, props);
	});
	
	updateOffsets();
}

function updateOffsets() {
	
	containingBlocksMap.keys().forEach((containingBlock) => {
		
		containingBlocksMap.set(containingBlock, {
			totalOffset: { top: 0, bottom: 0 },
		});
	});
	
	const stickyElements = document.querySelectorAll(STICKY_CLASSES);
	
	stickyElements.forEach((stickyElement) => {
		
		const props = stickyElementsMap.get(stickyElement);
		const containerProps = containingBlocksMap.get(props.container);
		
		if(!props){
			// There's a new sticky element. Refresh all.
			refreshStickyElements();
			return;
		}
		
		props.offset.top = containerProps.totalOffset.top;
		containerProps.totalOffset.top += props.sticksTo.top ? stickyElement.offsetHeight : 0;
		
		if (props.sticksTo.top) {
			stickyElement.style.top = `${props.offset.top}px`;
		}
		
		stickyElementsMap.set(stickyElement, props);
	});
	
	Array.prototype.toReversed.call(stickyElements).forEach((stickyElement) => {
		
		const props = stickyElementsMap.get(stickyElement);
		const containerProps = containingBlocksMap.get(props.container);
		
		props.offset.bottom = containerProps.totalOffset.bottom;
		containerProps.totalOffset.bottom += props.sticksTo.bottom ? stickyElement.offsetHeight : 0;
		
		if (props.sticksTo.bottom) {
			stickyElement.style.bottom = `${props.offset.bottom}px`;
		}
		
		stickyElementsMap.set(stickyElement, props);
	});
	
	stickyElements.forEach((stickyElement) => {
		
		const props = stickyElementsMap.get(stickyElement);
		
		// Set top and/or bottom insets for the element.
		stickyElement.style.top = `${(props.sticksTo.top && props.offset.top) || 0}px`;
		stickyElement.style.bottom = `${(props.sticksTo.bottom && props.offset.bottom) || 0}px`;
		
		// Create an intersection observer to update the z-index of the element.
		// This is for either when the not-currently-sticky element needs to scroll beneath currently-stuck elements,
		// or when the element becomes stuck itself.
		const intersectionObserver = new IntersectionObserver(
			(entries) => updateZIndex(entries[0].target),
			{
				root: props.container,
				threshold: [1],
				rootMargin: `-${props.offset.top}px 0px -${props.offset.bottom}px 0px`,
			}
		);
		
		props.intersectionObserver = intersectionObserver;
		stickyElementsMap.set(stickyElement, props);
		
		intersectionObserver.observe(stickyElement);
		resizeObserver.observe(stickyElement, { box: "border-box" });
	});
}

function resetContainingBlocks(stickyElements) {
	// Map all relevant containing blocks to initial values.
	// This is useful when the DOM structure changes and the containing blocks need to be re-evaluated.
	
	containingBlocksMap.clear();
	
	stickyElements.forEach((stickyElement) => {
		
		const containingBlock = getContainingBlock(stickyElement);
		
		if(window.getComputedStyle(containingBlock).zIndex === 'auto') {
			containingBlock.style.zIndex = 0;
		}
		
		if (!containingBlocksMap.has(containingBlock)) {
			containingBlocksMap.set(containingBlock, {
				totalOffset: { top: 0, bottom: 0 },
			});
		}
	});
}

function updateZIndex(stickyElement) {
	
	const props = stickyElementsMap.get(stickyElement);
	const stickyRect = getRect(stickyElement, props.container).borderBox;
	
	if (props.sticksTo.top){
		// The element is top-sticky.
		
		if (stickyRect.bottom > props.container.offsetHeight - props.offset.bottom
		|| stickyRect.top === props.offset.top) {
			// The element is both:
			// - not currently stuck to the top
			// - intersecting an element stuck to the bottom (hence it's not bottom-sticky)
			
			// Use the lower z-index to display the element behind bottom-sticky elements.
			props.zIndex = zIndexes.lower;
		}
		else {
			// The element is either or both:
			// - stuck to the top
			// - not intersecting a bottom-sticky element.
			
			// Use the upper z-index to display the element in front of not-top-sticky elements.
			props.zIndex = zIndexes.upper;
		}
	}
	
	stickyElement.style.zIndex = props.zIndex;
}

function getContainingBlock(elem) {
	// Traverse the DOM tree upwards to find the nearest containing block.
	
	while (elem && elem !== document.body) {
		if (createsContainingBlock(elem)) {
			return elem;
		}
		elem = elem.parentElement;
	}
	return document.body; // No containing block found.
}

function createsContainingBlock(elem) {
	// Check if the element is a containing block.
	// A containing block is an element that establishes a new coordinate system for its descendants.
	
	const style = getComputedStyle(elem);
	return (
		(style.position !== 'static' && style.overflowY !== 'visible') ||
		style.contain !== 'none' ||
		style.filter !== 'none' ||
		style.transform !== 'none' ||
		style.perspective !== 'none' ||
		style.willChange.includes('transform') ||
		style.willChange.includes('perspective')
	);
}
