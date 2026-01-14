# TODO: Resolver problemas en Tienda Canelitos

## 1. Botón de admin no funciona
- [x] Modificar `vistas/parciales/encabezado.ejs` para mostrar botón admin solo para usuarios con rol 'admin'

## 2. Permitir editar/eliminar reseñas propias en "acerca"
- [x] Agregar métodos `actualizar` y `eliminarPorUsuario` en `modelos/Resena.js`
- [x] Agregar rutas `/acerca/editar/:id` y `/acerca/eliminar/:id` en `rutas/tienda.js`
- [x] Agregar controladores `editarResena` y `eliminarResena` en `controladores/tiendaControlador.js`
- [x] Modificar `vistas/tienda/acerca.ejs` para mostrar botones editar/eliminar si la reseña pertenece al usuario logueado

## 3. Productos borrados desaparezcan de la lista
- [x] Modificar `Producto.todosAdmin()` en `modelos/Producto.js` para filtrar solo productos activos
- [x] Modificar `vistas/admin/productos.ejs` para no mostrar columna 'activo' ni botón 'Restaurar'
- [x] Eliminar ruta `/admin/productos/restaurar` en `rutas/admin.js` y controlador `restaurarProducto` en `controladores/adminControlador.js`
