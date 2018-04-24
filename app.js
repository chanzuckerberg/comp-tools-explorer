var colorby = 'cluster'
var selected = null
var searching = false
var highlighted = null

var layout = `
<div id='abstract'>
  <div id='title'></div>
  <div id='info'></div>
  <div id='summary'></div>
</div>
<div id='network'></div>
<div id='instructions'>Click on the nodes in the graph to learn more about the supported projects</div>
<div id='tree-container'>
  <div id='tree'></div>
</div>
<div id='search'>
  <span id='search-header' class='search-header'>search</span>
  <br>
  <input placeholder='type a name' id='search-inner'></div>
</div>
`
document.body.innerHTML = layout

d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  })
}

d3.selection.prototype.moveToBack = function() {  
  return this.each(function() { 
    var firstChild = this.parentNode.firstChild; 
    if (firstChild) { 
        this.parentNode.insertBefore(this, firstChild); 
    } 
  })
}

function setupTree () {
  var width = document.getElementById('tree').offsetWidth
  var height = document.getElementById('tree').offsetHeight
  var svg = d3.select('#tree').append('svg')
    .attr('width', width)
    .attr('height', height)

  var tree = d3.layout.tree()
    .size([height, width])
    .separation(function (a, b) {
      if (!a.children && !b.children) {
        return 0.7
      } else {
        return 1
      }
    })
    .sort(function (a, b) {
      return b.cluster - a.cluster
    })

  return {svg: svg, layout: tree, width: width, height: height}
}

function setupForce () {
  var width = document.getElementById('network').offsetWidth - 4
  var height = document.getElementById('network').offsetHeight - 4
  var svg = d3.select('#network').append('svg')
    .attr('width', width)
    .attr('height', height)

  var k = Math.sqrt(80 / (width * height));

  var force = d3.layout.force()
    .size([width, height])
    .linkStrength(1)
    .linkDistance(40)
    .charge(-200)
    .gravity(27 * k)

  return {svg: svg, layout: force, width: width, height: height}
}

var tree = setupTree()
var force = setupForce()

// document.getElementById('legend-header').innerHTML = colorby
// document.getElementById('legend-inner').innerHTML = getlegend(colorby)

var domains = {
  gender: ['Male', 'Female', 'None'],
  centrality: [0, 5],
  continent: ['North America', 'Europe'],
  years: [4, 20],
  cluster: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
}

var scales = {
  gender: d3.scale.ordinal()
    .domain(domains.gender).range(['rgb(110,170,190)', 'rgb(190,110,110)', 'rgb(110,110,110)']),
  continent: d3.scale.ordinal()
    .domain(domains.continent).range(['rgb(110,110,110)', 'rgb(242,160,104)']),
  years: d3.scale.linear()
    .domain(domains.years).range(['rgb(110,110,110)', 'rgb(80,200,150)']).clamp(true),
  cluster: d3.scale.ordinal()
    .domain(domains.cluster).range(['rgb(222,135,79)', 'rgb(198,150,50)', 'rgb(163,165,51)', 
      'rgb(114,177,52)', 'rgb(84,185,100)', 'rgb(87,190,158)', 'rgb(85,186,205)', 'rgb(78,174,240)', 
      'rgb(166,137,248)', 'rgb(215,114,236)', 'rgb(237,108,197)', 'rgb(237,117,145)'])
}

function gettitle (info) {
  if (info && info.title) {
    return `
    <div><span class='title'>${info.title}</span></div>
    `
  } else {
    return `<div class='title'>Collaborative computational tools for the human cell atlas</div>`
  }
}

function getsummary (info) {
  if (info && info.summary) {
    return `
    <div class='summary'>${info['summary']}</div>
    `
  } else if (!info) {
    return `<div class='summary'></div>`
  } else {
    return `<div class='summary'></div>`
  }
}

function getinfo (info) {
  if (info && info.investigator) {
    return `
    <div><span class='info-key'>investigator</span><span class='info-value'>${info.investigator}</span></div>
    <div><span class='info-key'>organization</span><span class='info-value'>${info.organization}</span></div>
    `
  } else if (info && info.description) {
    return `
    <div><span class='info-key'>${info.description}</span></div>
    `
  } else {
    return `<div><span class='info-key'>The goal of the Human Cell Atlas project is to create a shared, open reference atlas of all cells in the healthy human body as a resource for studies of health and disease. This global endeavor will generate a large variety of molecular and imaging data across a wide range of modalities and spatial scales. To analyze, interpret, and disseminate these data, these 85 projects will focus on creating new computational tools, algorithms, visualizations, and benchmark datasets. In the spirit of open, collaborative development, researchers will work together and share progress with each other to evaluate the strengths of different approaches. They will also work with our science and engineering teams to help enhance and package their tools, and where appropriate, link them to the Human Cell Atlas Data Coordination Platform.</span></div>`
  }
}

function getcolor (info, colorby) {
  return scales[colorby](info[colorby])
}

function getlegend (colorby) {
  if (colorby == 'gender') {
    return `<div>
      <div class='legend-value'>male<span class='legend-circle' style='background: rgb(110,170,190)'></span></div>
      <div class='legend-value'>female<span class='legend-circle' style='background: rgb(190,110,110)'></span></div>
      <div class='legend-value'>none<span class='legend-circle' style='background: rgb(100,100,100)'></span></div>
    </div>`
  }
  if (colorby == 'continent') {
    return `<div>
      <div class='legend-value'>n america<span class='legend-circle' style='background: rgb(100,100,100)'></span></div>
      <div class='legend-value'>europe<span class='legend-circle' style='background: rgb(242,160,104)'></span></div>
    </div>`
  }
  if (colorby == 'years') {
    return `<div>
      <div class='legend-value'>4<span class='legend-circle' style='background: rgb(100,100,100)'></span></div>
      <div class='legend-value'>20<span class='legend-circle' style='background: rgb(80,200,150)'></span></div>
    </div>`
  }
  if (colorby == 'cluster' && scales) {
    var labels = ['cell typing', 'cell state', 'trajectories', 'latent spaces', 
    'population variation', 'manifold alignment', 'multiomics', 'imaging', 
    'scale', 'compression', 'bioconductor', 'portals']
    var parts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (d) {
      return `<div class='legend-value'>${labels[d]}
        <span class='legend-circle' style='background:${scales.cluster(d)}'></span>
      </div>`
    })
    return parts.join('')
  }
}

function populateFields (info) {
  document.getElementById('title').style.opacity = 0
  document.getElementById('info').style.opacity = 0
  document.getElementById('summary').style.opacity = 0
  setTimeout(function () {
    document.getElementById('title').innerHTML = gettitle(info)
    document.getElementById('info').innerHTML = getinfo(info)
    document.getElementById('summary').innerHTML = getsummary(info)
    document.getElementById('title').style.opacity = 1
    document.getElementById('info').style.opacity = 1
    document.getElementById('summary').style.opacity = 1
    var el = d3.selectAll('.summary')[0][0]
    var top = el.offsetTop
    el.style.position = 'absolute'
    el.style.top = (top - 10) + 'px'
    el.style.bottom = '20px'
  }, 50)
}

function clearFields () {
  document.getElementById('title').style.opacity = 0
  document.getElementById('info').style.opacity = 0
  document.getElementById('summary').style.opacity = 0
  setTimeout(function () {
    document.getElementById('title').innerHTML = gettitle()
    document.getElementById('info').innerHTML = getinfo(info)
    document.getElementById('summary').innerHTML = getsummary()
    document.getElementById('title').style.opacity = 1
    document.getElementById('info').style.opacity = 1
    document.getElementById('summary').style.opacity = 1
  }, 50)
}

function showInstructions () {
  var el = document.getElementById('instructions')
  console.log('showing')
  if (el.style.opacity == 1) return
  else {
  setTimeout(function () {
      el.style.opacity = 1
    }, 0)
  }  
}

function hideInstructions () {
  var el = document.getElementById('instructions')
  console.log('hiding')
  if (el.style.opacity == 0) return
  else {
  setTimeout(function () {
      el.style.opacity = 0
    }, 0)
  }  
}

showInstructions()

function loadTree (groups, metadata, colorSelectedNodes, colorSelectedLinks) {

  var treeselect

  var data = {}
  data.nodes = tree.layout.nodes(groups)
  data.links = tree.layout.links(data.nodes)

  data.nodes.forEach(function(d) { 
    if (!d.children) {
      d.depth = 4
    }
    if (d.offset) {
      d.depth += d.offset
    }
    d.y = d.depth * tree.width / 12
  })

  var nodesize = Math.sqrt(tree.height * tree.width) / 80

  var links = tree.svg.selectAll('path.link')
      .data(data.links)
    .enter().append('path')
      .attr('class', 'tree-link')
      .style('stroke-width', '2px')
      .style('stroke', 'rgb(100,100,100)')
      .style('fill-opacity', 0)
      .style('stroke-opacity', 1)
      .style('stroke-linecap', 'square')
      .attr('d', function (d) {
        return [` M ${d.source.y},${d.source.x} L ${d.source.y},${d.target.x} L ${d.target.y},${d.target.x}`]
      })

  var nodes = tree.svg.selectAll('g.node')
      .data(data.nodes)
    .enter().append('g')
      .attr('class', 'node')
      .attr('transform', function(d) { 
        return 'translate(' + d.y + ',' + d.x + ')' })

  function drawlist (value) {
    if (value < 0) {
      tree.svg.selectAll('g.name-node')
        .style('opacity', 0)
        .style('r', 0)
        .style('pointer-events', 'none')
      tree.svg.selectAll('.name-link')
        .style('opacity', 0)
        .style('r', 0)
        .style('pointer-events', 'none')
    } else {
      var origin = _.filter(data.nodes, function (d) {
        return (!d.children & (d.cluster == value))
      })[0]
      var selected = _.filter(metadata, function (d) {
        return (d.cluster == origin.cluster)
      })

      var lengths = {0: 8.5, 1: 9, 2: 10.5, 3: 12.25, 4: 17, 
        5: 16.75, 6: 11, 7: 8.5, 8: 6.5, 9: 12, 10: 12.25, 11: 8}

      var dy = lengths[origin.cluster] * 10
      var ddy = 250
      var dx = tree.height / 12.05
      var sx = tree.height * 0.045

      tree.svg.append('path')
        .attr('d', [` M ${origin.y},${origin.x} L ${origin.y + ddy},${origin.x}`])
        .attr('class', 'name-link')
        .style('stroke-width', '2px')
        .style('stroke', 'rgb(100,100,100)')

      tree.svg.append('path')
        .attr('d', function () {
          if (origin.cluster > 5) {
            return [` M ${origin.y + ddy},${10} L ${origin.y + ddy},${sx + (selected.length - 1) * dx}`]
          } else {
            return [` M ${origin.y + ddy},${tree.height - 15} L ${origin.y + ddy},${tree.height - 10 - (selected.length - 1) * dx}`]
          }
        })
        .attr('class', 'name-link')
        .style('stroke-width', '2px')
        .style('stroke', 'rgb(100,100,100)')

      var namenodes = tree.svg.selectAll('g.namenodes')
        .data(selected)
      .enter().append('g')
        .attr('class', 'name-node')
        .attr('transform', function(d, i) {
          if (origin.cluster > 5) {
            return 'translate(' + (origin.y + ddy) + ',' + (sx + i * dx) + ')'
          } else {
            return 'translate(' + (origin.y + ddy) + ',' + (tree.height - sx - i * dx) + ')'
          }
        })

      var namecircles = namenodes.append('circle')
        .attr('class', 'name-circle')
        .attr('r', nodesize)
        .attr('fill-opacity', 1)
        .style('fill', function (d) {
          return getcolor(d, 'cluster')
        })
        .on('mouseover', function (d) {
          namecircles.attr('r', function (e) {
            if ((d.name == e.name)) return nodesize * 1.5
            else return nodesize
          })
        })
        .on('mouseout', function (d) {
          namecircles.attr('r', nodesize)
        })
        .on('click', function (d) {
          highlightname(d.name)
          colorSelectedNodes(d.name)
          colorSelectedLinks(d.name)
          populateFields(metadata[d.name])
        })

      var namelabels = namenodes.append('text')
        .attr('class', 'name-label')
        .attr('x', nodesize * 2)
        .attr('dy', '0.3em')
        .text(function (d) {
          return d.investigator.toLowerCase()
        })
        .on('mouseover', function (d) {
          //
        })
        .on('mouseout', function (d) {
          //
        })
        .on('click', function (d) {
          highlightname(d.name)
          colorSelectedNodes(d.name)
          colorSelectedLinks(d.name)
          populateFields(metadata[d.name])
        })

      d3.selectAll('.name-link').moveToBack()

    }
  }

  function highlightname (name) {
    if (name < 0) {
      tree.svg.selectAll('.name-label').style('font-weight', 400)
    } else {
      tree.svg.selectAll('.name-label').style('font-weight', function (e) {
        if (name == e.name) {
          return 800
        }
      })
    }
   
  }

  var circles = nodes.append('circle')
    .attr('class', 'tree-node')
    .attr('r', function (d) {
      if (!d.children) return nodesize
      return 0.75 * nodesize
    })
    .attr('fill-opacity', 1)
    .attr('stroke-opacity', 1)
    .style('stroke-width', function (d) {
      if (!d.children) {
        return '0.5px'
      } else {
        return '2px'
      }
    })
    .style('stroke', function (d) {
      if (!d.children) {
        return 'black'
      } else {
        return 'rgb(100,100,100)'
      }
    })
    .style('fill', function (d) {
      if (!d.children) {
        return getcolor(d, 'cluster')
      } else {
        return 'rgb(255,255,255)'
      }
    })
    .on('mouseover', function (d) {
      circles.attr('r', function (e) {
        if ((d.name == e.name) && !e.children) return nodesize * 1.5
        else if ((d.name == e.name)) return nodesize
        else if (!e.children) return nodesize
        else return nodesize * 0.75
      })
      highlightpath(d.cluster, d.depth)
    })
    .on('mouseout', function (d) {
      circles.attr('r', function (d) {
        if (!d.children) return nodesize
        return nodesize * 0.75
      })
      if (!treeselect) {
        highlightpath(-1)
      } else {
        highlightpath(treeselect.cluster, treeselect.depth)
      }
    })
    .on('click', function (d) {
      highlightbranch(d)
    })

  var labels = nodes.append('text')
    .attr('class', 'tree-label')
    .attr('x', function(d) { 
      return d.children || d._children ? -5 : nodesize * 2 })
    .attr('dy', function (d) {
      if (!d.children) return '.35em'
      else return '-0.4em'
    })
    .attr('text-anchor', function(d) { 
      return d.children || d._children ? 'end' : 'start' })
    .text(function(d) { 
      if (!d.children) return d.name
    })
    .style('fill-opacity', function (d) {
      if (!d.children) return 1
      else return 0
    })
    .on('click', function (d) {
      highlightbranch(d)
    })
    .on('mouseover', function (d) {
      highlightpath(d.cluster, d.depth)
    })
    .on('mouseout', function (d) {
      if (!treeselect) {
        highlightpath(-1)
      } else {
        highlightpath(treeselect.cluster, treeselect.depth)
      }
    })

  function highlightbranch (d) {
    treeselect = d
    drawlist(-1)
    if (!d.children) {
      drawlist(d.cluster)
    } 
    populateFields(d)
    var clusters = collect(d)
    var filtered = _.filter(metadata, function (e) {
      return ((e.cluster == d.cluster) | _.includes(clusters, e.cluster))
    }).map(function (e) {
      return e.name
    })
    colorSelectedNodes(filtered)
    colorSelectedLinks(filtered)
    highlightpath(d.cluster, d.depth)
    if (d.name == 'groups') {
      console.log('highlighting groups')
      treeselect = null
      showInstructions()
    } else {
      hideInstructions()
    }
  }

  function collect (node) {
    var clusters = []
    aggregate(node)
    return clusters
    function aggregate (node) {
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          if (node.children[i].children){
              aggregate(node.children[i])
          }
          else {
              clusters.push(node.children[i].cluster)
          }
        }
      }
    }
  }

  function highlightpath (value, maxdepth) {
    maxdepth = maxdepth || 100
    if (value == -1) {
      links.style('stroke-width', function (d) {
        return '2px'
      })
    } else {
      function check (node, value) {
        var inside = _.includes(collect(node), value)
        return (inside || node.cluster == value) && (node.depth <= maxdepth)
      }
      
      links.style('stroke-width', function (d) {
        if (check(d.target, value)) {
          return '5px'
        } else {
          return '2px'
        }
      })
    }
  }

  return {highlightpath:highlightpath, highlightname: highlightname, drawlist:drawlist}
}

populateFields()

d3.json('data/network.json', function (network) {
  d3.json('data/metadata.json', function (metadata) {
    d3.json('data/groups.json', function (groups) {

        var tree = loadTree(groups, metadata, colorSelectedNodes, colorSelectedLinks)

        network.links = network.links.map(function(l) {
          var ind1 = network.nodes.map(function(n) {return n.name}).indexOf(l.source)
          var ind2 = network.nodes.map(function(n) {return n.name}).indexOf(l.target)
          l.source = ind1
          l.target = ind2
          return l
        })

        force.layout
          .nodes(network.nodes)
          .links(network.links)
          .start()

        var link = force.svg.selectAll('.link')
            .data(network.links)
          .enter().append('line')
            .attr('class', 'link')
            .style('stroke-width', function(d) { 
              return Math.sqrt(d.value) * 4
            })
            .style('color', function (d) {
              return getcolor(metadata[d.source.name], colorby)
            })  

        var node = force.svg.selectAll('.node')
            .data(network.nodes)
          .enter().append('g')
            .attr('class', 'node')
            .call(force.layout.drag)

        var big = Math.sqrt(force.width * force.height) / 26
        var small = Math.sqrt(force.width * force.height) / 26

        var timer
          
        var nodes = node.append('circle')

        function colorSelectedNodes (match) {
          nodes.style('opacity', function (d) {
            if (match == d.name || _.includes(match, d.name)) {
              return 1.0
            } else {
              return 0.2
            }
          })
        }

        function colorSelectedLinks (match) {
          link.style('stroke-opacity', function (d) {
            if (match == d.source.name || _.includes(match, d.source.name)) {
              return 0.6
            } else {
              return 0.1
            }
          })
        }

        nodes
          .attr('class', 'circle')
          .attr('r', function(d) {
            if (d.group == 3) {
              return (big / 2) * 1.1
            } else {
              return (small / 2) * 1.1
            }
          })
          .style('fill', function (d) {
            return getcolor(metadata[d.name], colorby)
          })
          .on('click', function (e) {
            selected = e.name
            tree.drawlist(-1)
            tree.drawlist(metadata[e.name].cluster)
            tree.highlightname(e.name)
            tree.highlightpath(metadata[e.name].cluster)
            populateFields(metadata[selected])
            colorSelectedNodes(e.name)
            colorSelectedLinks(e.name)
            d3.event.stopPropagation()
          })

        force.svg.on('click', function() {
          if (searching) {
            colorSelectedNodes(highlighted)
            colorSelectedLinks(highlighted)
          } else {
            selected = null
            nodes.style('opacity', function (d) {
              return 1.0
            })
            link.style('stroke-opacity', function (d) {
              return 0.6
            })
            tree.drawlist(-1)
            tree.highlightpath(-1)
            clearFields()
            showInstructions()
          }
        })

        function recolor () {
          nodes.style('fill', function (d) {
            return getcolor(metadata[d.name], colorby)
          })

          link.style('stroke', function (d) {
            return getcolor(metadata[d.source.name], colorby)
          })
        }

        var searchBy = _.keys(metadata).map(function (d) {
          return {
            key: d,
            investigator: metadata[d]['investigator']
          }
        })

        var search = document.getElementById('search')
        search.oninput = function (e) {
          hideInstructions()
          searching = (e.data || e.inputType == 'insertFromPaste') ? true : false
          var target = e.srcElement.value
          highlighted = _.filter(searchBy, function (d) {
            return d.key.includes(target) || d.investigator.toLowerCase().includes(target.toLowerCase())
          }).map(function (d) {return d.key})
          colorSelectedNodes(highlighted)
          colorSelectedLinks(highlighted)
          if (highlighted.length == 1) {
            tree.drawlist(-1)
            tree.drawlist(metadata[highlighted[0]].cluster)
            tree.highlightname(highlighted[0])
            tree.highlightpath(metadata[highlighted[0]].cluster)
            populateFields(metadata[highlighted[0]])
          }
          if (e.srcElement.value == "") {
            populateFields()
            tree.highlightpath(-1)
            tree.drawlist(-1)
            showInstructions()
          }
          if (highlighted.length > 1 || highlighted.length == 0) {
            populateFields()
            tree.highlightpath(-1)
            tree.drawlist(-1)
          }
        }

        force.layout.on('tick', function() {
          link.attr('x1', function(d) { return d.source.x })
              .attr('y1', function(d) { return d.source.y })
              .attr('x2', function(d) { return d.target.x })
              .attr('y2', function(d) { return d.target.y })

        node.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })

        recolor()
        //
        // document.getElementById('legend-inner').innerHTML = getlegend(colorby)
        // document.getElementById('legend-header').innerHTML = colorby
      })
    })
  })
})