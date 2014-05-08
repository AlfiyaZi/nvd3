should = chai.should()

apiTest = apiTest || {}

apiTest.scatter = (instance, overrides=[])->
    options = [
        'clearHighlights'
        'highlightPoint'
        'x'
        'y'
        'size'
        'margin'
        'width'
        'height'
        'xScale'
        'yScale'
        'zScale'
        'xDomain'
        'yDomain'
        'sizeDomain'
        'xRange'
        'yRange'
        'sizeRange'
        'forceX'
        'forceY'
        'forceSize'
        'interactive'
        'pointKey'
        'pointActive'
        'padData'
        'padDataOuter'
        'clipEdge'
        'clipVoronoi'
        'useVoronoi'
        'clipRadius'
        'color'
        'shape'
        'onlyCircles'
        'id'
        'singlePoint'
        'duration'
    ]

    # model properties
    props = [
        'dispatch'
        'options'
    ]

    describe 'Inherited APIs', ->
        apiTest.layer(instance, [
            'color'
            'size'
        ])
    describe 'Scatter APIs', ->
        checkProperties
            instance: instance
            properties: options
            overrides: overrides
            parent: Scatter

describe 'Scatter Model', ->
    apiTest.scatter(nv.models.scatter())


