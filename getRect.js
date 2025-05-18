export default getRect;

/**
 * Get the position and dimensions of an element's border box, padding box, and content box.
 * @param {HTMLElement} element - The element for which to calculate position and dimensions.
 * @param {HTMLElement|number[]} [relativeTo] - Calculate position relative to another element or an [x, y] coordinate instead of to the viewport.
 */
function getRect(element, relativeTo = [0, 0]) {
	
	let originX, originY;
	
	if (relativeTo instanceof HTMLElement) {
		const relativeBorderBox = relativeTo.getBoundingClientRect();
		originX = relativeBorderBox.left;
		originY = relativeBorderBox.top;
	}
	else {
		[originX, originY] = relativeTo;
	}
	
	const borderBox = element.getBoundingClientRect();
	const style = window.getComputedStyle(element);
	
	const rect = {
		borderBox: {
			top: borderBox.top - originY,
			right: borderBox.right - originX,
			bottom: borderBox.bottom - originY,
			left: borderBox.left - originX,
			height: borderBox.height,
			width: borderBox.width,
		},
		paddingBox: {},
		contentBox: {},
		borderWidth: {},
		paddingWidth: {},
	};
	
	rect.borderBox.x = rect.borderBox.left;
	rect.borderBox.y = rect.borderBox.top;
	
	rect.borderWidth.top = parseFloat(style.borderTopWidth);
	rect.borderWidth.right = parseFloat(style.borderRightWidth);
	rect.borderWidth.bottom = parseFloat(style.borderBottomWidth);
	rect.borderWidth.left = parseFloat(style.borderLeftWidth);
	
	rect.paddingWidth.top = parseFloat(style.paddingTop);
	rect.paddingWidth.right = parseFloat(style.paddingRight);
	rect.paddingWidth.bottom = parseFloat(style.paddingBottom);
	rect.paddingWidth.left = parseFloat(style.paddingLeft);
	
	rect.paddingBox.top = rect.borderBox.top + rect.borderWidth.top;
	rect.paddingBox.right = rect.borderBox.right - rect.borderWidth.right;
	rect.paddingBox.bottom = rect.borderBox.bottom - rect.borderWidth.bottom;
	rect.paddingBox.left = rect.borderBox.left + rect.borderWidth.left;
	rect.paddingBox.x = rect.paddingBox.left;
	rect.paddingBox.y = rect.paddingBox.top;
	rect.paddingBox.height = rect.paddingBox.bottom - rect.paddingBox.top;
	rect.paddingBox.width = rect.paddingBox.right - rect.paddingBox.left;
	
	rect.contentBox.top = rect.paddingBox.top + rect.paddingWidth.top;
	rect.contentBox.right = rect.paddingBox.right - rect.paddingWidth.right;
	rect.contentBox.bottom = rect.paddingBox.bottom - rect.paddingWidth.bottom;
	rect.contentBox.left = rect.paddingBox.left + rect.paddingWidth.left;
	rect.contentBox.x = rect.contentBox.left;
	rect.contentBox.y = rect.contentBox.top;
	rect.contentBox.height = rect.contentBox.bottom - rect.contentBox.top;
	rect.contentBox.width = rect.contentBox.right - rect.contentBox.left;
	
	return rect;
}
