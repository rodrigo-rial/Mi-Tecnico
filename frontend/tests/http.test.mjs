import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

let secuencia = 0
async function cliente(conTecnicos = false) {
  let fuente = await readFile(new URL('../src/services/http.js', import.meta.url), 'utf8')
  fuente = fuente
    .replace(
      /import \{[\s\S]*?\} from '.\/authApi'/,
      `
    let access = 'anterior'
    export let renovaciones = 0
    export let cierres = 0
    export let fallaRenovacion = false
    export function fallarRenovacion() { fallaRenovacion = true }
    const cerrarSesion = () => { cierres++ }
    const guardarAccessToken = (valor) => { access = valor }
    const obtenerAccessToken = () => access
    const obtenerRefreshToken = () => 'refresh'
    const renovarToken = async () => {
      renovaciones++
      if (fallaRenovacion) throw new Error('Sesión vencida')
      return { access: 'renovado' }
    }
  `,
    )
    .replace('import.meta.env.VITE_API_URL', 'undefined')
  const urlHttp = `data:text/javascript,${encodeURIComponent(fuente)}#${secuencia++}`
  const http = await import(urlHttp)
  if (!conTecnicos) return http

  const fuenteTecnicos = (
    await readFile(new URL('../src/services/tecnicosApi.js', import.meta.url), 'utf8')
  ).replace("from './http'", `from ${JSON.stringify(urlHttp)}`)
  const tecnicos = await import(`data:text/javascript,${encodeURIComponent(fuenteTecnicos)}`)
  return { http, tecnicos }
}
const respuesta = (status, datos) =>
  new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

test('conserva el contrato JSON de las operaciones existentes', async (t) => {
  const api = await cliente()
  t.mock.method(globalThis, 'fetch', async (_url, opciones) => {
    assert.equal(opciones.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(opciones.body), { estado: 'finalizado' })
    return respuesta(200, { ok: true })
  })
  assert.deepEqual(
    await api.solicitarAutenticado('/trabajos/1/estado/', {
      method: 'POST',
      datos: { estado: 'finalizado' },
    }),
    { ok: true },
  )
})

test('renueva y reenvía el mismo archivo sin fijar Content-Type', async (t) => {
  const api = await cliente()
  const datos = new FormData()
  datos.append('imagen', new Blob(['foto'], { type: 'image/png' }), 'foto.png')
  let llamadas = 0
  t.mock.method(globalThis, 'fetch', async (_url, opciones) => {
    assert.equal(opciones.body, datos)
    assert.equal(opciones.headers['Content-Type'], undefined)
    assert.equal(await opciones.body.get('imagen').text(), 'foto')
    llamadas++
    assert.equal(
      opciones.headers.Authorization,
      llamadas === 1 ? 'Bearer anterior' : 'Bearer renovado',
    )
    return llamadas === 1 ? respuesta(401, { detail: 'expired' }) : respuesta(201, { id: 7 })
  })
  assert.deepEqual(
    await api.solicitarAutenticado('/trabajos/1/fotos/', { method: 'POST', datos }),
    { id: 7 },
  )
  assert.equal(llamadas, 2)
  assert.equal(api.renovaciones, 1)
})

test('no reintenta la subida si tampoco puede renovar la sesión', async (t) => {
  const api = await cliente()
  api.fallarRenovacion()
  let llamadas = 0
  t.mock.method(globalThis, 'fetch', async () => {
    llamadas++
    return respuesta(401, {})
  })
  await assert.rejects(
    api.solicitarAutenticado('/trabajos/1/fotos/', { method: 'POST', datos: new FormData() }),
    { status: 401 },
  )
  assert.equal(llamadas, 1)
  assert.equal(api.cierres, 1)
})

test('descarga una foto como blob despues de renovar el acceso', async (t) => {
  const api = await cliente()
  let llamadas = 0
  t.mock.method(globalThis, 'fetch', async () => {
    llamadas++
    return llamadas === 1
      ? respuesta(401, { detail: 'expired' })
      : new Response('imagen', { headers: { 'Content-Type': 'image/png' } })
  })
  const blob = await api.solicitarAutenticado('/solicitudes/1/fotos/1/', { archivo: true })
  assert.equal(blob.type, 'image/png')
  assert.equal(await blob.text(), 'imagen')
  assert.equal(api.renovaciones, 1)
})

test('conserva errores JSON en una descarga de foto rechazada', async (t) => {
  const api = await cliente()
  t.mock.method(globalThis, 'fetch', async () => respuesta(404, { detail: 'No encontrado' }))
  await assert.rejects(api.solicitarAutenticado('/solicitudes/1/fotos/1/', { archivo: true }), {
    status: 404,
    message: 'No encontrado',
  })
})

test('el perfil técnico renueva el acceso y conserva el PATCH y sus datos', async (t) => {
  const { http, tecnicos } = await cliente(true)
  const datos = { descripcion: 'Electricista', especialidades: [1], zonas: [2] }
  let llamadas = 0
  t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    assert.ok(url.endsWith('/tecnicos/perfil/'))
    assert.equal(opciones.method, 'PATCH')
    assert.deepEqual(JSON.parse(opciones.body), datos)
    llamadas++
    assert.equal(
      opciones.headers.Authorization,
      llamadas === 1 ? 'Bearer anterior' : 'Bearer renovado',
    )
    return respuesta(llamadas === 1 ? 401 : 200, llamadas === 1 ? {} : datos)
  })
  assert.deepEqual(await tecnicos.actualizarPerfilTecnico(datos), datos)
  assert.equal(llamadas, 2)
  assert.equal(http.renovaciones, 1)
})

test('documentación técnica conserva el archivo y no fija Content-Type al renovar', async (t) => {
  const { http, tecnicos } = await cliente(true)
  const formulario = new FormData()
  formulario.append(
    'documento_dni',
    new Blob(['documento'], { type: 'application/pdf' }),
    'dni.pdf',
  )
  let llamadas = 0
  t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    assert.ok(url.endsWith('/tecnicos/documentacion/'))
    assert.equal(opciones.method, 'PATCH')
    assert.equal(opciones.body, formulario)
    assert.equal(opciones.headers['Content-Type'], undefined)
    assert.equal(await opciones.body.get('documento_dni').text(), 'documento')
    llamadas++
    return respuesta(llamadas === 1 ? 401 : 200, { estado_validacion: 'PENDIENTE' })
  })
  assert.deepEqual(await tecnicos.actualizarDocumentacionTecnico(formulario), {
    estado_validacion: 'PENDIENTE',
  })
  assert.equal(llamadas, 2)
  assert.equal(http.renovaciones, 1)
})

test('perfil inexistente conserva el 404 sin renovar ni ocultar el error', async (t) => {
  const { http, tecnicos } = await cliente(true)
  t.mock.method(globalThis, 'fetch', async () => respuesta(404, { detail: 'Perfil no creado' }))
  await assert.rejects(tecnicos.obtenerPerfilTecnico(), {
    status: 404,
    message: 'Perfil no creado',
  })
  assert.equal(http.renovaciones, 0)
})

test('documentación no reintenta cuando la sesión no puede renovarse', async (t) => {
  const { http, tecnicos } = await cliente(true)
  http.fallarRenovacion()
  let llamadas = 0
  t.mock.method(globalThis, 'fetch', async () => {
    llamadas++
    return respuesta(401, {})
  })
  await assert.rejects(tecnicos.actualizarDocumentacionTecnico(new FormData()), { status: 401 })
  assert.equal(llamadas, 1)
  assert.equal(http.cierres, 1)
})
