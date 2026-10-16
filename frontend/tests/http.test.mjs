import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

let secuencia = 0
async function cliente() {
  let fuente = await readFile(new URL('../src/services/http.js', import.meta.url), 'utf8')
  fuente = fuente.replace(/import \{[\s\S]*?\} from '.\/authApi'/, `
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
  `).replace('import.meta.env.VITE_API_URL', 'undefined')
  return import(`data:text/javascript,${encodeURIComponent(fuente)}#${secuencia++}`)
}
const respuesta = (status, datos) => new Response(JSON.stringify(datos), {
  status, headers: { 'Content-Type': 'application/json' },
})

test('conserva el contrato JSON de las operaciones existentes', async (t) => {
  const api = await cliente()
  t.mock.method(globalThis, 'fetch', async (_url, opciones) => {
    assert.equal(opciones.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(opciones.body), { estado: 'finalizado' })
    return respuesta(200, { ok: true })
  })
  assert.deepEqual(await api.solicitarAutenticado('/trabajos/1/estado/', { method: 'POST', datos: { estado: 'finalizado' } }), { ok: true })
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
    assert.equal(opciones.headers.Authorization, llamadas === 1 ? 'Bearer anterior' : 'Bearer renovado')
    return llamadas === 1 ? respuesta(401, { detail: 'expired' }) : respuesta(201, { id: 7 })
  })
  assert.deepEqual(await api.solicitarAutenticado('/trabajos/1/fotos/', { method: 'POST', datos }), { id: 7 })
  assert.equal(llamadas, 2)
  assert.equal(api.renovaciones, 1)
})

test('no reintenta la subida si tampoco puede renovar la sesión', async (t) => {
  const api = await cliente()
  api.fallarRenovacion()
  let llamadas = 0
  t.mock.method(globalThis, 'fetch', async () => { llamadas++; return respuesta(401, {}) })
  await assert.rejects(api.solicitarAutenticado('/trabajos/1/fotos/', { method: 'POST', datos: new FormData() }), { status: 401 })
  assert.equal(llamadas, 1)
  assert.equal(api.cierres, 1)
})
