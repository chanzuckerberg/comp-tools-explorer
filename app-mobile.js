var cluster = 'cell type'
var id = 0

var layout = `
<div id='header' class='header'>Collaborative computational tools for the human cell atlas</div>
<div id='container-mobile'>
	<div id='selection'>
	  <select id='selection-menu'>
	  </select>
	</div>
	<div id='browser-mobile'>
		<div id='backward' class='arrow'><span class="simple-svg" data-icon="fa-regular:arrow-alt-circle-left" data-inline="false"></span></div>
		<div id='forward' class='arrow'><span class="simple-svg" data-icon="fa-regular:arrow-alt-circle-right" data-inline="false"></span></div>
	</div>
</div>
<div id='counter'></div>
<div id='abstract-mobile'>
  <div id='title'><div  class='title'>collaborative computational tools for the human cell atlas</div></div>
  <div id='info'><div class='info-key'>click the nodes to learn more</div></div>
  <div id='summary'><div class='summary-mobile'></div></div>
  
</div>
`
document.body.innerHTML = layout

function gettitle (info) {
  if (info && info.title) {
    return `
    <div><span class='title'>${info.title}</span></div>
    `
  } else {
    return `<div class='title'></div>`
  }
}

function getsummary (info) {
  if (info && info.summary) {
    return `
    <div class='summary-mobile'>${info['summary']}</div>
    `
  } else {
    return `<div class='summary-mobile'></div>`
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
    return `<div class='info-key'></div>`
  }
}

var domains = {
  cluster: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
}

var scales = {
  cluster: d3.scale.ordinal()
    .domain(domains.cluster).range(['rgb(222,135,79)', 'rgb(198,150,50)', 'rgb(163,165,51)', 
      'rgb(114,177,52)', 'rgb(84,185,100)', 'rgb(87,190,158)', 'rgb(85,186,205)', 'rgb(78,174,240)', 
      'rgb(166,137,248)', 'rgb(215,114,236)', 'rgb(237,108,197)', 'rgb(237,117,145)'])
}

var clusters = ['cell type', 'cell state', 'trajectories','latent spaces','population variation',
	'manifold alignment','multiomics','imaging','scale','compression', 'bioconductor', 'portals']

function getcolor (info, colorby) {
  return scales[colorby](info[colorby])
}

domains.cluster.forEach(function (d) {
	var text = clusters[d]
	if (text == 'population variation') text = 'populations'
	if (text == 'manifold alignment') text = 'manifolds'
	var el = document.getElementById('selection-menu')
	var add = document.createElement('option')
	add.className = 'selection-option'
	add.value = clusters[d]
	add.innerHTML = text
	el.appendChild(add)
})

d3.json('data/metadata.json', function (metadata) {

	function getcount (cluster) {
		var lookup = _.findIndex(clusters, function (d) {
			return d == cluster
		})
		return _.filter(metadata, function (d) {
			return d.cluster == lookup
		}).length
	}

	function update (cluster, index) {
		var lookup = _.findIndex(clusters, function (d) {
			return d == cluster
		})
		var filtered = _.filter(metadata, function (d) {
			return d.cluster == lookup
		})
		var count = filtered.length
		var grant = filtered[index]

		document.getElementById('title').innerHTML = gettitle(grant)
	  document.getElementById('info').innerHTML = getinfo(grant)
	  document.getElementById('summary').innerHTML = getsummary(grant)

    document.getElementById('selection').style.background = scales['cluster'](lookup)
    document.getElementById('counter').innerHTML = 'project ' + (index + 1) + ' / ' + count
	}

	update('cell type', 0)

	var selection = document.getElementById('selection')
	var forward = document.getElementById('forward')
	var backward = document.getElementById('backward')

	selection.onchange = function (e) {
		id = 0
		cluster = e.target.value
		update(cluster, id)
	}

	forward.onclick = function (e) {
		id = (id == (getcount(cluster) - 1)) ? id : id + 1
		update(cluster, id)
	}

	backward.onclick = function (e) {
		id = (id == 0) ? id : id - 1
		update(cluster, id)
	}

})

