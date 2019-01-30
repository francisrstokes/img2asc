const renderArea = document.querySelector('pre');

const grayscaleFns = {
  average: (r, g, b) => (r + g + b) / 3,
  lightness: (r, g, b) => (Math.max(r, g, b) + Math.min(r, g, b)) / 2,
  luminosity: (r, g, b) => (0.21*r + 0.72*g + 0.07*b) / 3
};

const variables = {
  pow: 1,
  colors: document.getElementById('chars').value,
  useInversion: false,
  df: 0,
  grayscaleFn: grayscaleFns.average
};

let imgCached = null;

const mapRange = ([c, d], [a, b], v) => (v-a)/(b-a) * (d-c) + c;
const mapToGradient = (x, r) => {
  const v = x / 255;
  return mapRange(r, [0, 1], v ** variables.pow);
};

const processImage = (img, w, h) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const pixels = imgData.data;

  const data = Array.from({length: h}, () => '');

  const range = variables.useInversion
    ? [0, variables.colors.length-1]
    : [variables.colors.length-1, 0];

  for (let i = 0; i < pixels.length; i += 4) {
    const row = Math.floor((i/4) / w);

    if (pixels[i+3] === 0) {
      data[row] += ' ' + ' ';
      continue;
    }
    const b = variables.grayscaleFn(pixels[i], pixels[i+1], pixels[i+2]);
    const v = Math.round(mapToGradient(b, range));
    data[row] += variables.colors[v] + variables.colors[v];
  }
  return data;
};

const downscale = (ascImg, level) => {
  if (level === 0) return ascImg;
  const next = ascImg.reduce((acc, row, i) => {
    return (i % 2 === 0) ? [
      ...acc,
      row.split('').reduce((str, c, j) => j % 2 === 0 ? str + c : str, '')
    ] : acc;
  }, []);
  return downscale(next, level - 1);
};

const process = () => {
  if (imgCached) {
    const res = processImage(imgCached, imgCached.width, imgCached.height);
    const ds = downscale(res, variables.df);
    renderArea.innerHTML = ds.join('\n').replace(/</g, '&lt;');
  }
};

const handleFileSelect = e => {
  const fileDesc = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      imgCached = img;
      process();
    };
    img.src = reader.result;
  };
  if (fileDesc) reader.readAsDataURL(fileDesc);
};

document.getElementById('files').addEventListener('change', handleFileSelect);
document.getElementById('downscaleFactor').addEventListener('change', e => {
  variables.df = Number(e.target.value);
  process();
});
document.getElementById('inversion').addEventListener('change', e => {
  variables.useInversion = e.target.checked;
  process();
});
document.getElementById('chars').addEventListener('change', e => {
  variables.colors =  e.target.value;
  process();
});
document.getElementById('gradPow').addEventListener('change', e => {
  variables.pow = Number(e.target.value);
  process();
});

document.querySelectorAll('input[name="grayscaleFn"]')
  .forEach(el =>
    el.addEventListener('change', e => {
      variables.grayscaleFn = grayscaleFns[e.target.value];
      process();
    })
  );