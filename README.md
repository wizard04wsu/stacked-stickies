Stack Sticky-Positioned Elements
=================
This is a script to make sticky-positioned elements stack on top of each other when they are in the same container.

Add class `sticky-top`, `sticky-bottom`, `sticky-left`, and/or `sticky-right` to the element you want to make sticky. The script will automatically add the appropriate CSS rules to make the element sticky and position it to stack against other sticky elements instead of overlapping them.

Add class `sticky-container` to the container element to make it a container block so that its sticky descendants are handled separately from other sticky elements in the document.

Customize the starting z-index of the sticky elements by setting the `data-sticky-z-index` attribute on the `html` element. The default value is 1000.
