# PROJECT_CONTEXT.md

# Contexto del Proyecto

## Nombre del proyecto

LicitAR

## Descripción

Sistema SaaS desarrollado con Django y Python para centralizar, monitorear y analizar licitaciones públicas de salud publicadas en múltiples portales gubernamentales y organismos estatales.

El sistema realizará scraping automático de licitaciones, almacenará la información en una base de datos centralizada y permitirá búsquedas avanzadas, alertas, dashboards y estadísticas.

## Problema que resuelve

Actualmente las licitaciones públicas se encuentran distribuidas entre múltiples sitios:

- ministerios;
- hospitales;
- organismos provinciales;
- portales de compras estatales.

Las empresas deben revisar manualmente múltiples páginas diariamente.

El sistema busca automatizar:
- detección;
- clasificación;
- almacenamiento;
- búsqueda;
- alertas.

## Usuarios objetivo

- Droguerías
- Distribuidores médicos
- Empresas de equipamiento médico
- Proveedores del Estado
- Administradores internos

## Objetivos principales

- Centralizar licitaciones.
- Automatizar scraping.
- Detectar duplicados.
- Generar alertas automáticas.
- Permitir búsquedas avanzadas.
- Descargar PDFs automáticamente.
- Generar estadísticas.
- Exponer API REST.

## Módulos principales

- Autenticación
- Dashboard
- Licitaciones
- Scrapers
- Alertas
- Estadísticas
- OCR
- API

## Funcionalidades clave

- Scraping automático
- Descarga de pliegos
- OCR de PDFs
- Filtros avanzados
- Favoritos
- Alertas email
- Alertas Telegram
- Historial
- Exportación Excel/PDF

## Restricciones técnicas

- Debe soportar múltiples fuentes.
- Debe ser escalable.
- Debe soportar scraping dinámico.
- Debe ejecutarse con Docker.
- Debe utilizar PostgreSQL.
