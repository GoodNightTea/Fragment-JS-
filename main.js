import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

// Create a scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Shader code
const vertexShader = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float iTime;
  uniform vec2 iResolution;

  vec3 palette(float d) {
    return mix(vec3(0.1, 0.9, 1.2), vec3(0.0, 0.2, 0.0), d);
  }

  vec2 rotate(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return p * mat2(c, s, -s, c);
  }

  float map(vec3 p) {
    for (int i = 0; i < 2; ++i) {
      float t = iTime * 0.2;
      p.xz = rotate(p.xz, t);
      p.xy = rotate(p.xy, t * 1.89);
      p.xz = abs(p.xz);
      p.xz -= 0.5;
    }
    return dot(sign(p), p) / 4.3;
  }

  vec4 rm(vec3 ro, vec3 rd) {
    float t = 0.0;
    vec3 col = vec3(0.01);
    float d;
    for (float i = 0.0; i < 100.0; i++) {
      vec3 p = ro + rd * t;
      d = map(p) * 0.5;
      if (d < 0.02) {
        break;
      }
      if (d > 100.0) {
        break;
      }
      col += palette(length(p) * 0.1) / (400.0 * (d));
      t += d;
    }
    return vec4(col, 1.0 / (d * 100.0));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - (iResolution.xy / 2.0)) / iResolution.x;
    vec3 ro = vec3(0.0, 0.0, -50.0);
    ro.xz = rotate(ro.xz, iTime);
    vec3 cf = normalize(-ro);
    vec3 cs = normalize(cross(cf, vec3(0.0, 1.0, 0.0)));
    vec3 cu = normalize(cross(cf, cs));

    vec3 uuv = ro + cf * 3.0 + uv.x * cs + uv.y * cu;
    vec3 rd = normalize(uuv - ro);

    vec4 col = rm(ro, rd);

    gl_FragColor = col;
  }
`;

// Create a custom ShaderMaterial
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  }
});

// Create a plane geometry to display the shader
const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, shaderMaterial);

// Add the shader mesh to the scene
scene.add(mesh);

// Set the camera position
camera.position.z = 1;

// Handle window resizing
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  shaderMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
});

// Render loop
function animate() {
  shaderMaterial.uniforms.iTime.value += 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
