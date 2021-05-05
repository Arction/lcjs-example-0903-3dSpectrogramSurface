/*
 * LightningChartJS example that showcases Surface Grid Series 3D to render a 3D spectrogram.
 */
// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Extract required parts from LightningChartJS.
const {
    lightningChart,
    AxisTickStrategies,
    ColorRGBA,
    LUT,
    PalettedFill,
    SurfaceSeriesTypes3D,
    AxisScrollStrategies,
    UIElementBuilders,
    UIOrigins,
    UILayoutBuilders,
    UIBackgrounds,
    Themes
} = lcjs

const {
    createSpectrumDataGenerator
} = require('@arction/xydata')


// Length of single data sample.
const dataSampleSize = 60

// Length of data history.
const dataHistoryLength = 50


// Setup PalettedFill for dynamically coloring Surface by Y coordinate.
const lut = new LUT( {
    steps: [
        { value: 15, color: ColorRGBA( 4, 11, 125 ) },
        { value: 30, color: ColorRGBA( 4, 130, 5 ) },
        { value: 60, color: ColorRGBA( 132, 15, 4 ) },
        { value: 100, color: ColorRGBA( 255, 255, 0 ) }
    ],
    units: 'dB',
    interpolate: true
} )
const paletteFill = new PalettedFill( { lut, lookUpProperty: 'y' } )


// Create Chart3D and configure Axes.
const chart3D = lightningChart().Chart3D({
    // theme: Themes.dark
})
    .setTitle( '3D Surface Grid Spectrogram' )
    .setBoundingBox( { x: 1, y: 1, z: 2 } )
chart3D.getDefaultAxisY()
    .setScrollStrategy( AxisScrollStrategies.expansion )
    .setInterval( 0, 100 )
    .setTitle( 'Power spectrum P(f)' )
chart3D.getDefaultAxisX()
    .setTitle( 'Frequency (Hz)' )
chart3D.getDefaultAxisZ()
    .setTitle( 'Time' )
    .setTickStrategy( AxisTickStrategies.Empty )
    .setInterval( 0, dataHistoryLength )


// Create Surface Grid Series.
// pixelate: true adds one extra col+row to Surface, offset that here.
const rows = dataHistoryLength - 1
const columns = dataSampleSize - 1

const surfaceGridSeries = chart3D.addSurfaceSeries( {
    type: SurfaceSeriesTypes3D.Grid,
    rows,
    columns,
    start: { x: 0, z: dataHistoryLength },
    end: { x: dataSampleSize, z: 0 },
    pixelate: true
} )
    .setFillStyle( paletteFill )
    .setName('Spectrogram')

// Add LegendBox to chart.
const legend = chart3D.addLegendBox().add(chart3D)


// Setup data streaming.
let samplesAmount = 0
createSpectrumDataGenerator()
    .setSampleSize( dataSampleSize )
    .setNumberOfSamples( dataHistoryLength )
    .setVariation( 3 )
    .generate()
    .setStreamRepeat( true )
    .setStreamInterval( 1000 / 60 )
    .setStreamBatchSize( 1 )
    .toStream()
    // Scale Y values from [0.0, 1.0] to [0.0, 80]
    .map( sample => sample.map( y => y * 80 ) )
    // Push Y values to Surface Grid as Rows.
    .forEach( sample => {
        const infiniteStreamingDataEnabled = toggleStreamingCheckBox.getOn()
        const addSample = infiniteStreamingDataEnabled || samplesAmount < dataHistoryLength
        if ( addSample ) {
            surfaceGridSeries.addRow( 1, 'y', [sample] )
            samplesAmount ++
        }
    } )


// Animate Camera movement from file.
;(async () => {
    const cameraAnimationData = await (
        fetch( document.head.baseURI + 'examples/assets/lcjs_example_0903_3dSpectrogramSurface-camera.json' )
            .then( r => r.json() )
    )
    if ( ! cameraAnimationData ) {
        console.log(`No Camera animation data.`)
        return
    }
    console.log(`Loaded Camera animation data.`)
    let frame = 0
    const nextFrame = () => {
        if ( cameraAnimationEnabledCheckbox.getOn() ) {
            const { cameraLocation } = cameraAnimationData.frames[Math.floor(frame) % cameraAnimationData.frames.length]
            chart3D.setCameraLocation( cameraLocation )
            frame += 4
        }
        requestAnimationFrame( nextFrame )
    }
    requestAnimationFrame( nextFrame )
})()



// * UI controls *
const group = chart3D.addUIElement( UILayoutBuilders.Column
    .setBackground( UIBackgrounds.Rectangle )
)
group
    .setPosition( { x: 0, y: 100 } )
    .setOrigin( UIOrigins.LeftTop )
    .setMargin( 10 )
    .setPadding( 4 )

// Add UI control for toggling between infinite streaming data and static data amount.
const handleStreamingToggled = ( state ) => {
    toggleStreamingCheckBox.setText( state ? 'Disable infinite streaming data' : 'Enable infinite streaming data' )
    if ( toggleStreamingCheckBox.getOn() !== state ) {
        toggleStreamingCheckBox.setOn( state )
    }
}
const toggleStreamingCheckBox = group.addElement( UIElementBuilders.CheckBox )
toggleStreamingCheckBox.onSwitch(( _, state ) => handleStreamingToggled( state ) )
handleStreamingToggled( true )

// Add UI control for toggling camera animation.
const handleCameraAnimationToggled = ( state ) => {
    cameraAnimationEnabledCheckbox.setText( state ? 'Disable camera animation' : 'Enable camera animation' )
    if ( cameraAnimationEnabledCheckbox.getOn() !== state ) {
        cameraAnimationEnabledCheckbox.setOn( state )
    }
}
const cameraAnimationEnabledCheckbox = group.addElement( UIElementBuilders.CheckBox )
cameraAnimationEnabledCheckbox.onSwitch((_, state) => handleCameraAnimationToggled( state ))
handleCameraAnimationToggled( true )
chart3D.onBackgroundMouseDrag(() => {
    handleCameraAnimationToggled( false )
})
