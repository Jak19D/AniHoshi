const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async () => {
  const SRC = 'assets/icon-original.png';
  const BG = { r: 10, g: 15, b: 29, alpha: 1 };
  const SIZE = 1024;

  const margin = 90;
  const zoomed = await sharp(SRC)
    .extract({
      left: margin,
      top: margin,
      width: SIZE - margin * 2,
      height: SIZE - margin * 2,
    })
    .resize(SIZE, SIZE, { fit: 'fill' })
    .png()
    .toBuffer();

  const fullIcon = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: BG },
  })
    .composite([{ input: zoomed, gravity: 'centre' }])
    .flatten({ background: BG })
    .removeAlpha()
    .ensureAlpha()
    .png()
    .toBuffer();

  await sharp(fullIcon).toFile('assets/icon.png');
  await sharp(fullIcon).toFile('assets/adaptive-icon.png');

  await sharp(fullIcon)
    .resize(256, 256)
    .png()
    .toFile('assets/icon-preview-256.png');

  const densities = [
    { dir: 'mipmap-mdpi', launcher: 48, fg: 108 },
    { dir: 'mipmap-hdpi', launcher: 72, fg: 162 },
    { dir: 'mipmap-xhdpi', launcher: 96, fg: 216 },
    { dir: 'mipmap-xxhdpi', launcher: 144, fg: 324 },
    { dir: 'mipmap-xxxhdpi', launcher: 192, fg: 432 },
  ];

  for (const d of densities) {
    const outDir = path.join('android/app/src/main/res', d.dir);
    await sharp(fullIcon).resize(d.launcher, d.launcher).webp({ quality: 100 }).toFile(path.join(outDir, 'ic_launcher.webp'));
    await sharp(fullIcon).resize(d.fg, d.fg).webp({ quality: 100 }).toFile(path.join(outDir, 'ic_launcher_foreground.webp'));
    await sharp(fullIcon).resize(d.launcher, d.launcher).png().toFile(path.join(outDir, 'ic_launcher.png'));
  }

  fs.writeFileSync(
    'android/app/src/main/res/drawable/ic_launcher_background.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="@color/iconBackground"/>
</shape>
`
  );

  const anydpi = 'android/app/src/main/res/mipmap-anydpi-v26';
  fs.mkdirSync(anydpi, { recursive: true });
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/iconBackground"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpi, 'ic_launcher.xml'), xml);
  fs.writeFileSync(path.join(anydpi, 'ic_launcher_round.xml'), xml);

  const splashSizes = [
    { dir: 'drawable-mdpi', size: 288 },
    { dir: 'drawable-hdpi', size: 432 },
    { dir: 'drawable-xhdpi', size: 576 },
    { dir: 'drawable-xxhdpi', size: 864 },
    { dir: 'drawable-xxxhdpi', size: 1152 },
  ];
  for (const s of splashSizes) {
    await sharp(fullIcon)
      .resize(s.size, s.size)
      .png()
      .toFile(path.join('android/app/src/main/res', s.dir, 'splashscreen_logo.png'));
  }

  const { data, info } = await sharp('assets/icon.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) transparent++;
  console.log('Done. transparent pixels:', transparent, 'size', info.width + 'x' + info.height);
  console.log('Preview: assets/icon-preview-256.png');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
