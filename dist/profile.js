export function makeProfile(saved, onSave) {
  const form = document.getElementById('pilot-form');
  const name = document.getElementById('pilot-name');
  const file = document.getElementById('pilot-photo');
  const preview = document.getElementById('pilot-preview');
  const placeholder = document.getElementById('pilot-placeholder');
  const adjust = document.getElementById('pilot-adjust');
  const remove = document.getElementById('pilot-remove');
  const status = document.getElementById('pilot-status');
  const submit = form.querySelector('button[type=submit]');
  const controls = ['zoom', 'horizontal', 'vertical'].map(id => document.getElementById('pilot-' + id));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 224;
  const ctx = canvas.getContext('2d');
  let profile = saved || {name: '', photo: ''};
  let source = null, photo = '', revision = 0;

  function showPhoto(value) {
    photo = value;
    if (photo) preview.src = photo;
    else preview.removeAttribute('src');
    preview.hidden = !photo;
    placeholder.hidden = !!photo;
    remove.hidden = !photo;
  }

  function crop() {
    const size = canvas.width;
    const [zoom, horizontal, vertical] = controls.map(control => Number(control.value));
    const scale = size / Math.min(source.naturalWidth, source.naturalHeight) * zoom / 100;
    const width = source.naturalWidth * scale;
    const height = source.naturalHeight * scale;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(source, (size - width) * horizontal / 100, (size - height) * vertical / 100, width, height);
    ctx.restore();
    showPhoto(canvas.toDataURL('image/png'));
  }

  function open() {
    revision++;
    name.value = profile.name;
    file.value = '';
    source = null;
    adjust.hidden = true;
    status.textContent = '';
    submit.disabled = false;
    showPhoto(profile.photo);
  }

  file.addEventListener('change', async () => {
    const selected = file.files[0];
    if (!selected) return;
    const id = ++revision;
    const url = URL.createObjectURL(selected);
    const image = new Image();
    submit.disabled = true;
    status.textContent = 'Opening photo…';
    try {
      image.src = url;
      await image.decode();
      if (id !== revision) return;
      source = image;
      controls.forEach(control => { control.value = control.defaultValue; });
      crop();
      adjust.hidden = false;
      status.textContent = 'Frame your face with the crop controls.';
    } catch {
      if (id === revision) status.textContent = 'This photo could not be opened. Try a JPEG, PNG, or WebP.';
    } finally {
      URL.revokeObjectURL(url);
      if (id === revision) submit.disabled = false;
    }
  });

  for (const control of controls) control.addEventListener('input', crop);
  remove.addEventListener('click', () => {
    revision++;
    source = null;
    file.value = '';
    adjust.hidden = true;
    status.textContent = '';
    submit.disabled = false;
    showPhoto('');
  });
  name.addEventListener('input', () => name.setCustomValidity(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const displayName = name.value.trim();
    if (!displayName) {
      name.setCustomValidity('Enter a pilot name.');
      name.reportValidity();
      return;
    }
    profile = {name: displayName, photo};
    onSave(profile);
  });
  open();
  return {open};
}
