const STARTING_Z_INDEX = 1000;
const STICKY_CLASS_PREFIX = 'sticky';

const STICKY_CLASSES = `.${STICKY_CLASS_PREFIX}-top, .${STICKY_CLASS_PREFIX}-bottom`;

let startingZIndex;

const stickyElementsMap = new Map();
const containingBlocksMap = new Map();

const resizeObserver = new ResizeObserver((entries)=>refreshStickyElements());

document.addEventListener('DOMContentLoaded', () => {
	
	document.styleSheets[0].insertRule(`${STICKY_CLASSES} { position: sticky; }`, 0);
	document.styleSheets[0].insertRule(`.${STICKY_CLASS_PREFIX}-container { position: relative; overflow: auto; }`, 0);
	
	startingZIndex = window.parseInt(document.documentElement.dataset.stickyZIndex) || STARTING_Z_INDEX;
	
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
	
	// Map containing blocks to initial states.
	resetContainingBlocks(stickyElements);
	
	stickyElements.forEach((stickyElement) => {
		
		const containingBlock = getContainingBlock(stickyElement);
		const containerProps = containingBlocksMap.get(containingBlock);
		const props = generateStickyProperties(stickyElement, containingBlock);
		
		if (props.sticksTo.top) {
			stickyElement.style.top = `${props.offset.top}px`;
		}
		if (props.sticksTo.bottom) {
			stickyElement.style.bottom = `${props.offset.bottom}px`;
		}
		
		const intersectionObserver = new IntersectionObserver(
			intersectionHandler,
			{
				root: containingBlock,
				threshold: [1],
				rootMargin: `${props.offset.top}px 0px ${props.offset.bottom}px 0px`,
			}
		);
		
		props.intersectionObserver = intersectionObserver;
		
		props.offset.top = containerProps.totalOffset.top;
		containerProps.totalOffset.top += props.sticksTo.top ? stickyElement.offsetHeight : 0;
		
		stickyElementsMap.set(stickyElement, props);
		
		intersectionObserver.observe(stickyElement);
		resizeObserver.observe(stickyElement, { box: "border-box" });
	});
	
	Array.prototype.toReversed.apply(stickyElements).forEach((stickyElement) => {
		
		const props = stickyElementsMap.get(stickyElement);
		const containerProps = containingBlocksMap.get(props.container);
		
		props.offset.bottom = containerProps.totalOffset.bottom;
		containerProps.totalOffset.bottom += props.sticksTo.bottom ? stickyElement.offsetHeight : 0;
		
		stickyElementsMap.set(stickyElement, props);
	});
	
	stickyElements.forEach((stickyElement) => {
		
		const props = stickyElementsMap.get(stickyElement);
		
		stickyElement.style.top = `${(props.sticksTo.top && props.offset.top) || 0}px`;
		stickyElement.style.bottom = `${(props.sticksTo.bottom && props.offset.bottom) || 0}px`;
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

function generateStickyProperties(stickyElement, containingBlock) {
	
		const containerProps = containingBlocksMap.get(containingBlock);
		
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
		
		props.zIndex = props.sticksTo.top ? startingZIndex+2 : startingZIndex+1;
		
		return props;
}

function intersectionHandler(entries) {
	
	const stickyElement = entries[0].target;
	
	const stickyRect = stickyElement.getBoundingClientRect();
	const props = stickyElementsMap.get(stickyElement);
	console.log(props.sticksTo.top,  stickyRect.bottom, props.container.offsetHeight, props.offset.bottom);
	
	if(props.sticksTo.top){
		if(stickyRect.bottom >= props.container.offsetHeight - props.offset.bottom) {
			props.zIndex = startingZIndex;
		}
		else {
			props.zIndex = startingZIndex+2;
		}
	}
	
	stickyElement.style.zIndex = props.zIndex;
}

function getContainingBlock(elem) {
	// Traverse the DOM tree upwards to find the nearest containing block.
	
	while (elem && elem !== document.documentElement) {
		if (createsContainingBlock(elem)) {
			return elem;
		}
		elem = elem.parentElement;
	}
	return document.documentElement; // No containing block found.
}

function createsContainingBlock(elem) {
	// Check if the element is a containing block.
	// A containing block is an element that establishes a new coordinate system for its descendants.
	
	const style = getComputedStyle(elem);
	return (
		(style.position !== 'static' && style.overflow !== 'visible') ||
		style.contain !== 'none' ||
		style.filter !== 'none' ||
		style.transform !== 'none' ||
		style.perspective !== 'none' ||
		style.willChange.includes('transform') ||
		style.willChange.includes('perspective')
	);
}
