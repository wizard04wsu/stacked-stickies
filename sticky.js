const STARTING_Z_INDEX = 1000;
const STICKY_CLASS_PREFIX = 'sticky';

const STICKY_CLASSES = `.${STICKY_CLASS_PREFIX}-top, .${STICKY_CLASS_PREFIX}-right, .${STICKY_CLASS_PREFIX}-bottom, .${STICKY_CLASS_PREFIX}-left`;

let startingZIndex;
let stickyElements;
let stickyElementsMap;
let containingBlocksMap;

document.addEventListener('DOMContentLoaded', () => {
	
	document.styleSheets[0].insertRule(`${STICKY_CLASSES} { position: sticky; }`, 0);
	
	const customStartingZIndex = 1*document.documentElement.dataset.stickyZIndex?.replace(/^(\d+).*/, '$1');
	startingZIndex = customStartingZIndex || STARTING_Z_INDEX;
	
	refreshStickyElements();
	window.addEventListener('resize', refreshStickyElements);
});

function refreshStickyElements() {
	// Refresh all sticky elements.
	
	stickyElementsMap = new Map();
	containingBlocksMap = new Map();
	
	stickyElements = document.querySelectorAll(STICKY_CLASSES);

	stickyElements.forEach((stickyElement) => {
		const containingBlock = getContainingBlock(stickyElement);
		if(window.getComputedStyle(containingBlock).zIndex === 'auto') {
			containingBlock.style.zIndex = 0;
		}
		stickyElementsMap.set(stickyElement, containingBlock);
		containingBlocksMap.set(containingBlock, { top: 0, right: 0, bottom: 0, left: 0, zIndex: startingZIndex });
	});
	
	updateStickyInsets();
	updateStickyZIndexes();
}

function updateStickyInsets() {
	// Update positioning insets for all sticky elements.
	// This ensures that sticky elements are stacked within their containing blocks.
	
	const reverseMap = new Map();
	
	stickyElements.forEach((stickyElement) => {
		
		const containingBlock = stickyElementsMap.get(stickyElement);
		const props = containingBlocksMap.get(containingBlock);
		
		if (stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-top`)) {
			stickyElement.style.top = props.top + 'px';
			props.top += stickyElement.offsetHeight;
		}
		if (stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-left`)) {
			stickyElement.style.left = props.left + 'px';
			props.left += stickyElement.offsetWidth;
		}
		
		containingBlocksMap.set(containingBlock, props);
	});
	
	Array.prototype.toReversed.apply(stickyElements).forEach((stickyElement) => {
		
		const containingBlock = stickyElementsMap.get(stickyElement);
		const props = containingBlocksMap.get(containingBlock);
		
		if (stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-bottom`)) {
			stickyElement.style.bottom = props.bottom + 'px';
			props.bottom += stickyElement.offsetHeight;
		}
		if (stickyElement.classList.contains(`${STICKY_CLASS_PREFIX}-right`)) {
			stickyElement.style.right = props.right + 'px';
			props.right += stickyElement.offsetWidth;
		}
		
		containingBlocksMap.set(containingBlock, props);
	});
}

function updateStickyZIndexes() {
	// Update z-index for all sticky elements.
	// This ensures that sticky elements are layered correctly within their containing blocks.
	
	containingBlocksMap.forEach((props, containingBlock) => {
		const stickyElements = Array.from(stickyElementsMap.keys()).filter((stickyElement) => stickyElementsMap.get(stickyElement) === containingBlock);
		
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
