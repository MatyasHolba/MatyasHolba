const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_scrollY;
  uniform float u_themeFade;
  uniform float u_sectionTop;
  uniform float u_isHovering;

  // Modulo 289
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  // Simplex noise 2D
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i); 
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 pos = gl_FragCoord.xy; // pixel coords
    
    // Scroll offset (make the pattern move up as we scroll down)
    pos.y += u_scrollY * 0.5;

    // Base noise coordinate
    vec2 noiseCoord = pos * 0.001;
    
    // Add time for organic movement
    float timeObj = u_time * 0.2;
    
    // Warping the space (PewDiePie wavy lines effect)
    float warpX = snoise(noiseCoord + vec2(timeObj, 0.0)) * 2.0;
    float warpY = snoise(noiseCoord + vec2(0.0, timeObj)) * 2.0;
    vec2 warpedPos = noiseCoord + vec2(warpX, warpY) * 0.5;

    // Create the "topographic" lines using sine waves
    float lines = sin(warpedPos.x * 20.0 + warpedPos.y * 20.0);
    lines = smoothstep(0.8, 0.9, lines); // sharp lines
    
    // Define the colors based on theme
    vec3 t0_baseBg = vec3(0.02, 0.02, 0.028); // #050507
    vec3 t0_baseLine = vec3(0.08, 0.08, 0.1);
    vec3 t0_hoverBg = vec3(1.0, 1.0, 1.0); // #fff
    vec3 t0_hoverLine = vec3(0.365, 1.0, 0.569); // #5dff91
    
    vec3 t1_baseBg = vec3(1.0, 1.0, 1.0);
    vec3 t1_baseLine = vec3(0.9, 0.9, 0.92);
    vec3 t1_hoverBg = vec3(0.02, 0.02, 0.028);
    vec3 t1_hoverLine = vec3(0.08, 0.08, 0.1);

    // Calculate spatial boundary for top transition
    float boundaryY = u_resolution.y - u_sectionTop;
    boundaryY += sin(gl_FragCoord.x * 0.003 + u_time * 0.5) * 20.0 + cos(gl_FragCoord.x * 0.007 - u_time * 0.3) * 15.0;
    
    // spatialTheme is 1.0 below the boundary, 0.0 above
    float spatialTheme = 1.0 - smoothstep(boundaryY - 1.0, boundaryY + 1.0, gl_FragCoord.y);
    
    // Combine with bottom fade
    float finalTheme = spatialTheme * u_themeFade;

    vec3 baseBg = mix(t0_baseBg, t1_baseBg, finalTheme);
    vec3 baseLine = mix(t0_baseLine, t1_baseLine, finalTheme);
    vec3 hoverBg = mix(t0_hoverBg, t1_hoverBg, finalTheme);
    vec3 hoverLine = mix(t0_hoverLine, t1_hoverLine, finalTheme);
    
    // Compute colors based on lines
    vec3 colorBase = mix(baseBg, baseLine, lines);
    vec3 colorHover = mix(hoverBg, hoverLine, lines);
    
    // Compute distance to mouse
    vec2 delta = gl_FragCoord.xy - vec2(u_mouse.x, u_resolution.y - u_mouse.y);
    float angle = atan(delta.y, delta.x);
    
    // Organic wobble using trig
    float rOff = sin(angle * 4.0 + timeObj * 10.0) * 15.0 + cos(angle * 3.0 - timeObj * 7.5) * 15.0;
    float dist = length(delta) + rOff;
    
    // Smooth blending at the edge of the bubble
    float mask = (1.0 - smoothstep(140.0, 180.0, dist)) * u_isHovering;
    
    // Mix the base theme with the hover theme based on the mask
    vec3 finalColor = mix(colorBase, colorHover, mask);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function initBgShader() {
  const canvas = document.getElementById('global-webgl-bg');
  if (!canvas) return;
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.warn('WebGL not supported, falling back to basic background');
    return;
  }

  // Compile shader
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  // Full screen quad
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0
  ]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uScrollY = gl.getUniformLocation(program, 'u_scrollY');
  const uThemeFade = gl.getUniformLocation(program, 'u_themeFade');
  const uSectionTop = gl.getUniformLocation(program, 'u_sectionTop');
  const uIsHovering = gl.getUniformLocation(program, 'u_isHovering');

  const frameScene = document.getElementById('frame-scene');

  let mouseX = -1000;
  let mouseY = -1000;
  let scrollY = window.scrollY;
  let isHovering = 0.0;

  let isTouchDevice = false;
  window.addEventListener('touchstart', () => { isTouchDevice = true; }, { passive: true, once: true });

  window.addEventListener('mouseenter', () => {
    isHovering = 1.0;
  });
  window.addEventListener('mouseleave', () => {
    isHovering = 0.0;
  });

  window.addEventListener('mousemove', (e) => {
    if (isTouchDevice) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    isHovering = 1.0;
  });
  
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      isHovering = 1.0;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
      isHovering = 1.0;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isHovering = 0.0;
  });
  
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  function resize() {
    const maxDim = 2560;
    const scale = Math.min(1, maxDim / Math.max(window.innerWidth, window.innerHeight));
    canvas.width = Math.floor(window.innerWidth * scale);
    canvas.height = Math.floor(window.innerHeight * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  const startTime = performance.now();

  function render(now) {
    const time = (now - startTime) / 1000;
    
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.uniform1f(uScrollY, scrollY);
    gl.uniform1f(uIsHovering, isHovering);
    
    let fadeTheme = 1.0;
    let sectionTop = 10000.0;
    if (frameScene) {
      const rect = frameScene.getBoundingClientRect();
      sectionTop = rect.top;
      let tOut = Math.min(1.0, Math.max(0.0, rect.bottom / (window.innerHeight * 0.5)));
      fadeTheme = tOut;
    }
    gl.uniform1f(uThemeFade, fadeTheme);
    gl.uniform1f(uSectionTop, sectionTop);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  
  requestAnimationFrame(render);
}

// Start
initBgShader();
