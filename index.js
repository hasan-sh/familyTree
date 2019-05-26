console.log('This is our family tree!!');
fetch('/data.json')
    .then((res) => res.json())
    .then((data) => {
        const root = d3.hierarchy(data[0]);
        const diagonal = d3
            .linkHorizontal()
            .x((d) => d.y)
            .y((d) => d.x);

        const dx = 100;
        const dy = 100;
        const tree = d3.tree().nodeSize([dx, dy]);

        const margin = { top: 25, right: 120, bottom: 20, left: 150 };

        root.x0 = dy / 2;
        root.y0 = 0;
        makeInformation(root);
        root.descendants().forEach((d, i) => {
            d.id = i;
            d._children = d.children;
            if (d.depth && d.data.name.length !== 7) d.children = null;
        });

        const width = 1200;

        const svg = d3
            .create('svg')
            .attr('width', width)
            .attr('height', dx)
            .attr('viewBox', [-margin.left, -margin.top, width, dx])
            .style('font', '18px sans-serif')
            .style('user-select', 'none');

        const gLink = svg
            .append('g')
            .attr('fill', 'none')
            .attr('stroke', '#555')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2.5);

        const gNode = svg.append('g');

        function update(source) {
            const duration = d3.event && d3.event.altKey ? 2500 : 250;
            const nodes = root.descendants().reverse();
            const links = root.links();

            // Compute the new tree layout.
            tree(root);

            let left = root;
            let right = root;
            root.eachBefore((node) => {
                if (node.x < left.x) left = node;
                if (node.x > right.x) right = node;
            });

            const height = right.x - left.x + margin.top + margin.bottom;

            const transition = svg
                .transition()
                .duration(duration)
                .attr('height', height)
                .attr('viewBox', [
                    -margin.left,
                    left.x - margin.top,
                    width,
                    height
                ])
                .tween(
                    'resize',
                    window.ResizeObserver
                        ? null
                        : () => () => svg.dispatch('toggle')
                );

            // Update the nodes…
            const node = gNode.selectAll('g').data(nodes, (d) => d.id);

            // Enter any new nodes at the parent's previous position.
            const nodeEnter = node
                .enter()
                .append('g')
                .style('outline', (d) =>
                    d._children ? '1px solid #555' : 'none'
                )
                .attr('cursor', (d) => (d._children ? 'pointer' : 'auto'))
                .attr(
                    'transform',
                    (d) => `translate(${source.y0},${source.x0})`
                )
                .attr('fill-opacity', 0)
                .attr('stroke-opacity', 0)
                .on('click', (d) => {
                    d.children = d.children ? null : d._children;
                    update(d);
                });

            // nodeEnter
            //     .append('circle')
            //     .attr('r', d => d.id === 0 ? 2.5 : 0)
            //     .attr('fill', (d) => (d._children ? '#555' : '#999'));

            nodeEnter
                .append('text')
                .attr('dy', '0.11em')
                // .attr('x', (d) => (d._children ? -6 : 6))
                .attr('x', (d) => d.id === 0 ? -10 : 0)
                // .attr('text-anchor', (d) => (d._children ? 'end' : 'start'))
                // .attr('text-anchor', (d) => 'start')
                .text((d) => d.data.name)
                .clone(true)
                .lower()
                .attr('stroke-linejoin', 'round')
                .attr('stroke-width', 5)
                .attr('stroke', 'white');

            // Transition nodes to their new position.
            const nodeUpdate = node
                .merge(nodeEnter)
                .transition(transition)
                .attr('transform', (d) => `translate(${d.y},${d.x})`)
                .attr('fill-opacity', 1)
                .attr('stroke-opacity', 1);

            // Transition exiting nodes to the parent's new position.
            const nodeExit = node
                .exit()
                .transition(transition)
                .remove()
                .attr('transform', (d) => `translate(${source.y},${source.x})`)
                .attr('fill-opacity', 0)
                .attr('stroke-opacity', 0);

            // Update the links…
            const link = gLink
                .selectAll('path')
                .data(links, (d) => d.target.id);

            // Enter any new links at the parent's previous position.
            const linkEnter = link
                .enter()
                .append('path')
                .attr('d', (d) => {
                    const o = { x: source.x0, y: source.y0 };
                    return diagonal({ source: o, target: o });
                });

            // Transition links to their new position.
            link.merge(linkEnter)
                .transition(transition)
                .attr('d', diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit()
                .transition(transition)
                .remove()
                .attr('d', (d) => {
                    const o = { x: source.x, y: source.y };
                    return diagonal({ source: o, target: o });
                });

            // Stash the old positions for transition.
            root.eachBefore((d) => {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        update(root);

        return svg.node();
    })
    .then((node) => d3.select(document.querySelector('#tree')).append(() => node));

function makeInformation(root) {
    const div = document.querySelector('.calc');
    const oi = document.createElement('oi');
    const li = document.createElement('li');
    oi.setAttribute('dir', 'rtl');
    let childrenCount = 0;
    let grandChildrenCount = 0;
    root.data.children.forEach((parent) => {
        childrenCount++
        grandChildrenCount = loopThrough(parent.children, grandChildrenCount);
    });
    li.innerHTML += `لحسن شحود ${childrenCount} أولاد و${grandChildrenCount} حفيد.`
    oi.appendChild(li);
    div.append(oi);
}

let count = 0;
function loopThrough(nodes, i) {
    count = i;
    nodes.forEach((node) => {
        count += 1;
        if (node.children) { loopThrough(node.children, count); }
    });
    return count;
}
