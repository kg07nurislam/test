const svg = d3.select("svg")
  .call(d3.zoom().scaleExtent([0.5, 2]).on("zoom", (event) => {
    g.attr("transform", event.transform);
  }))
  .append("g")
  .attr("transform", "translate(100,100)");

const g = svg.append("g");

// Filter for box-shadow
svg.append("defs")
  .append("filter")
  .attr("id", "shadow")
  .append("feDropShadow")
  .attr("dx", 0)
  .attr("dy", 0)
  .attr("stdDeviation", 3)
  .attr("flood-color", "#46E9FF");

const treeLayout = d3.tree().nodeSize([100, 200]);
let i = 0;
let duration = 1000;

function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function update(source) {
  const treeData = treeLayout(root);
  const nodes = treeData.descendants();
  const links = treeData.links();
  
  nodes.forEach(d => d.y = d.depth * 180);
  
  const node = g.selectAll('g.node')
    .data(nodes, d => d.id || (d.id = ++i));
  
  const nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr("transform", d => `translate(${source.y0},${source.x0})`)
    .on("click", (event, d) => {
      d.children = d.children ? null : d._children;
      update(d);
    });
  
  // Text first (to measure)
  nodeEnter.append("text")
    .attr("class", "label")
    .attr("dy", "0.30em")
    .attr("x", 0)
    .attr("text-anchor", "start")
    .text(d => d.data.name)
    .style("font", "16px sans-serif")
    .each(function(d) {
      const padding = 10;
      const textWidth = this.getBBox().width;
      const textHeight = this.getBBox().height;
      const bgWidth = textWidth + padding * 2;
      const bgHeight = textHeight + padding * 2;
      
      // Add background rect with box-shadow filter
      d3.select(this.parentNode).insert("rect", "text")
        .attr("x", -padding - 7)
        .attr("y", -textHeight / 1.3 - padding / 2)
        .attr("width", bgWidth + 5)
        .attr("height", bgHeight)
        .attr("rx", 10)
        .attr("fill", "#d0f0c0")
        .attr("filter", "url(#shadow)"); // Apply shadow filter here
      
      // Add circle inside rect, at left
      d3.select(this.parentNode).append("circle")
        .attr("r", 5)
        .attr("cx", -padding / 1.5)
        .attr("cy", 0)
        .attr("fill", "#3C4CFE")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);
    });
  
  const nodeUpdate = nodeEnter.merge(node);
  
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", d => `translate(${d.y},${d.x})`);
  
  node.exit().transition()
    .duration(duration)
    .attr("transform", d => `translate(${source.y},${source.x})`)
    .remove();
  
  const link = g.selectAll("path.link")
    .data(links, d => d.target.id);
  
  const linkEnter = link.enter().insert("path", "g")
    .attr("class", "link")
    .attr("d", d => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal({ source: o, target: o });
    });
  
  linkEnter.merge(link).transition()
    .duration(duration)
    .attr("d", d => diagonal(d));
  
  link.exit().transition()
    .duration(duration)
    .attr("d", d => {
      const o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    })
    .remove();
  
  nodes.forEach(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function diagonal(d) {
  return `M${d.source.y},${d.source.x}
          C${(d.source.y + d.target.y) / 2},${d.source.x}
           ${(d.source.y + d.target.y) / 2},${d.target.x}
           ${d.target.y},${d.target.x}`;
}

d3.json("data.json").then(data => {
  root = d3.hierarchy(data);
  root.x0 = 0;
  root.y0 = 0;
  
  if (root.children) {
    root.children.forEach(collapse);
  }
  
  update(root);
});
