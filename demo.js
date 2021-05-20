let map;
let source;

const mapOptions = {
  tilt: 0,
  heading: 0,
  zoom: 18,
  //center: { lat: 35.6594945, lng: 139.6999859 }, // shibuya station
  center: { lat: 35.6585, lng: 139.7448 }, // tokyo tower
  mapId: "15431d2b469f209e",
};

function initMap() {
  const mapDiv = document.getElementById("map");
  map = new google.maps.Map(mapDiv, mapOptions);
  const animal = new URLSearchParams(location.search).get('animal') || 'fox'

  const fox = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Embedded/Fox.gltf'
  const fish = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/30203d9c61288d0c6e4554eea3d5ebd2a31805ed/2.0/BarramundiFish/glTF/BarramundiFish.gltf'
  const duck = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/30203d9c61288d0c6e4554eea3d5ebd2a31805ed/2.0/Duck/glTF-Embedded/Duck.gltf'


  if (animal === 'fox') {
    source = fox;
  } else if (animal === 'fish') {
    source = fish;
  } else {
    source = duck;
  }

  initWebglOverlayView(map)
}

function initWebglOverlayView(map) {
  let scene, renderer, camera, loader;
  const webglOverlayView = new google.maps.WebglOverlayView();

  webglOverlayView.onAdd = () => {
    // Set up the scene.
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75); // Soft white light.
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0.5, -1, 0.5);
    scene.add(directionalLight);
    // Load the model.
    loader = new THREE.GLTFLoader();
    const pin = "https://raw.githubusercontent.com/googlemaps/js-samples/master/assets/pin.gltf";
    //const source = 'https://storage.googleapis.com/shuuji3-gltf-models/apple/scene.gltf' // ~80MB!
    loader.load(pin, (gltf) => {
      gltf.scene.scale.set(20, 20, 20);
      gltf.scene.rotation.x = Math.PI / 2; // Rotations are in radians.
      scene.add(gltf.scene);
    });
    loader.load(source, (gltf) => {
      gltf.scene.scale.set(1, 1, 1);
      gltf.scene.rotation.x = Math.PI / 2; // Rotations are in radians.
      scene.add(gltf.scene);
    });
  };

  webglOverlayView.onContextRestored = (gl) => {
    // Create the three.js renderer, using the
    // maps's WebGL rendering context.
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    renderer.autoClear = false;

    // Wait to move the camera until the 3D model loads.
    loader.manager.onLoad = () => {
      renderer.setAnimationLoop(() => {
        webglOverlayView.requestRedraw();
        const { tilt, heading, zoom } = mapOptions;
        map.moveCamera({ tilt, heading, zoom });

        // Rotate the map 360 degrees.
        if (mapOptions.tilt < 67.5) {
          mapOptions.tilt += 1;
        } else if (mapOptions.heading >= -270) {
          mapOptions.heading -= 0.5;
          mapOptions.zoom -= 0.0007;
        } else {
          renderer.setAnimationLoop(null);
        }
      });
    };
  };

  webglOverlayView.onDraw = (gl, transformer) => {
    // Update camera matrix to ensure the model is georeferenced correctly on the map.
    const matrix = transformer.fromLatLngAltitude(mapOptions.center, 130);
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
    webglOverlayView.requestRedraw();
    renderer.render(scene, camera);
    // Sometimes it is necessary to reset the GL state.
    // WebGLRenderer.resetState is available in three@0.128.0 https://github.com/mrdoob/three.js/pull/20859
    renderer.resetState();
  };
  webglOverlayView.setMap(map);
}
