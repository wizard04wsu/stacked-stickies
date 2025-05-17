const STARTING_Z_INDEX = 1000;
const STICKY_CLASS_PREFIX = 'sticky';

const STICKY_CLASSES = `.${STICKY_CLASS_PREFIX}-top, .${STICKY_CLASS_PREFIX}-right, .${STICKY_CLASS_PREFIX}-bottom, .${STICKY_CLASS_PREFIX}-left`;

const resizeObserver = new ResizeObserver((entries)=>updateStickyInsets());

let startingZIndex;
let stickyElements;
let stickyElementsMap;
let containingBlocksMap;

document.addEventListener('DOMContentLoaded', () => {
	
	document.styleSheets[0].insertRule(`${STICKY_CLASSES} { position: sticky; }`, 0);
	document.styleSheets[0].insertRule(`.${STICKY_CLASS_PREFIX}-container { position: relative; overflow: auto; }`, 0);
	
	const customStartingZIndex = 1*document.documentElement.dataset.stickyZIndex?.replace(/^(\d+).*/, '$1');
	startingZIndex = customStartingZIndex || STARTING_Z_INDEX;
	
	refreshStickyElements();
});

function refreshStickyElements() {
	// Refresh all sticky elements.
	
	resizeObserver.disconnect();
	
	stickyElementsMap = new Map();
	containingBlocksMap = new Map();
	
	stickyElements = document.querySelectorAll(STICKY_CLASSES);
	
	stickyElements.forEach((stickyElement) => {
		
		stickyElement.style.zIndex = startingZIndex+1;
		
		const containingBlock = getContainingBlock(stickyElement);
		if(window.getComputedStyle(containingBlock).zIndex === 'auto') {
			containingBlock.style.zIndex = 0;
		}
		
		stickyElementsMap.set(stickyElement, { container: containingBlock});
		containingBlocksMap.set(containingBlock, { top: 0, right: 0, bottom: 0, left: 0, zIndex: startingZIndex+1 });
		
		resizeObserver.observe(stickyElement, { box: "border-box" });
	});
	
	updateStickyInsets();
	//updateStickyZIndexes();
}

function resetContainingBlocks() {
	// Reset all containing blocks.
	// This is useful when the DOM structure changes and we need to re-evaluate the containing blocks.
	
	containingBlocksMap.forEach((props, containingBlock) => {
		props.top = props.right = props.bottom = props.left = 0;
	});
}

function updateStickyInsets() {
	// Update positioning insets for all sticky elements.
	// This ensures that sticky elements are stacked within their containing blocks.
	
	resetContainingBlocks();
	
	stickyElements.forEach((stickyElement) => {
		
		const containingBlock = stickyElementsMap.get(stickyElement).container;
		const props = containingBlocksMap.get(containingBlock);
		const style = stickyElement.style;
		
		if (stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-top`)) {
			style.top = props.top + 'px';
			props.top += stickyElement.offsetHeight;
		}
		if (stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-left`)) {
			style.left = props.left + 'px';
			props.left += stickyElement.offsetWidth;
		}
		
		containingBlocksMap.set(containingBlock, props);
	});
	
	Array.prototype.toReversed.apply(stickyElements).forEach((stickyElement) => {
		
		const containingBlock = stickyElementsMap.get(stickyElement).container;
		const props = containingBlocksMap.get(containingBlock);
		const style = stickyElement.style;
		
		if (stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-bottom`)) {
			style.bottom = props.bottom + 'px';
			props.bottom += stickyElement.offsetHeight;
		}
		if (stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-right`)) {
			style.right = props.right + 'px';
			props.right += stickyElement.offsetWidth;
		}
		
		containingBlocksMap.set(containingBlock, props);
		
		const intersectionObserver = createIntersectionObserver(stickyElement);
		
		intersectionObserver.observe(stickyElement);
	});
}

function createIntersectionObserver(stickyElement) {
	// Create an IntersectionObserver to monitor the visibility of the sticky element.
	
	const containingBlock = stickyElementsMap.get(stickyElement).container;
	const props = containingBlocksMap.get(containingBlock);
	const style = stickyElement.style;
	
	const intersectionObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					style.zIndex = startingZIndex;
				} else {
					style.zIndex = startingZIndex+1;
				}
			});
		},
		{
			root: containingBlock,
			threshold: [1],
			rootMargin: `${style.top} ${style.right} ${style.bottom} ${style.left}`,
		}
	);
	
	return intersectionObserver;
	
}

function updateStickyZIndexes() {
	// Update z-index for all sticky elements.
	// This ensures that sticky elements are layered correctly within their containing blocks.
	
	containingBlocksMap.forEach((props, containingBlock) => {
		const stickyElements = Array.from(stickyElementsMap.keys())
			.filter((stickyElement) => stickyElementsMap.get(stickyElement).container === containingBlock);
		
		stickyElements.forEach((stickyElement) => {
			const zIndex = props.zIndex++;
			stickyElement.style.zIndex = zIndex;
		});
	});
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
