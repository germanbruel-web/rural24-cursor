--
-- PostgreSQL database dump
--

\restrict IaOEKxEdhfKwpYi4wXcyTsZwcqJhUDeW04dDwXll1LBK5SknwmwNjS0gVcGXV5U

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.brands VALUES ('551fa38e-c714-48b5-b475-a6dbd23ae456', 'John Deere', 'john-deere', NULL, NULL, 'Estados Unidos', 'Líder mundial en maquinaria agrícola desde 1837', true, 1, '{}', '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');
INSERT INTO public.brands VALUES ('f5e11de0-b9c6-41df-8544-648ebd33a1c3', 'New Holland', 'new-holland', NULL, NULL, 'Estados Unidos', 'Innovación y tecnología en equipamiento agrícola', true, 2, '{}', '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');
INSERT INTO public.brands VALUES ('0e64cdba-a515-4bdc-9bbe-93b14fd1f15c', 'Massey Ferguson', 'massey-ferguson', NULL, NULL, 'Reino Unido', 'Tradición y calidad desde 1847', true, 3, '{}', '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');
INSERT INTO public.brands VALUES ('80a96097-6b63-4251-bfef-212da9e5022e', 'Case IH', 'case-ih', NULL, NULL, 'Estados Unidos', 'Potencia y confiabilidad en el campo', true, 4, '{}', '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');
INSERT INTO public.brands VALUES ('57ff0788-9d4b-46bf-859a-1ede5e421e30', 'Valtra', 'valtra', NULL, NULL, 'Finlandia', 'Innovación escandinava en agricultura', true, 5, '{}', '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');
INSERT INTO public.brands VALUES ('5ec6c4af-b651-498c-92e9-35ed8d5eb61f', 'Deutz-Fahr', 'deutz-fahr', NULL, NULL, 'Alemania', 'Ingeniería alemana de precisión', true, 6, '{}', '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');
INSERT INTO public.brands VALUES ('f81bb093-8c0b-481e-85f6-d3229185f012', 'Fendt', 'fendt', NULL, NULL, 'Alemania', 'Tecnología premium AGCO', true, 7, '{}', '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');
INSERT INTO public.brands VALUES ('d6bf3094-f758-4830-a52f-e089901770ac', 'Kubota', 'kubota', NULL, NULL, 'Japón', 'Tractores compactos de alta calidad', true, 8, '{}', '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categories VALUES ('9b98e866-5aca-4d58-874b-dc91c30acf1f', 'ganaderia', 'Ganadería', NULL, 'icon-2.png', true, 999, '2025-12-20 13:27:29.479495+00', '2025-12-20 13:27:29.479495+00', 'ganaderia');
INSERT INTO public.categories VALUES ('6fd68a5b-4236-48ad-b8c3-57dcdbbcb6bf', 'insumosagropecuarios', 'Insumos Agropecuarios', NULL, 'icon-3.png', true, 999, '2026-01-06 11:19:30.58273+00', '2026-01-06 11:19:30.58273+00', 'insumos-agropecuarios');
INSERT INTO public.categories VALUES ('3773410d-505b-4cfc-874a-865cfe1370d6', 'maquinariasagricolas', 'Maquinarias Agrícolas', NULL, 'icon-1.png', true, 1, '2025-12-20 12:44:40.328333+00', '2025-12-20 12:44:40.328333+00', 'maquinarias-agricolas');
INSERT INTO public.categories VALUES ('65284d0d-79cd-432e-a166-102f43dba5fa', 'inmueblesrurales', 'Inmuebles Rurales', NULL, 'icon-4.png', true, 999, '2026-01-08 22:30:49.681397+00', '2026-01-08 22:30:49.681397+00', 'inmuebles-rurales');
INSERT INTO public.categories VALUES ('92f47089-0073-4df0-bb3d-60f17152fd75', 'serviciosrurales', 'Servicios Rurales', NULL, 'icon-6.png', true, 999, '2026-01-10 23:17:20.080081+00', '2026-01-10 23:17:20.080081+00', 'servicios-rurales');


--
-- Data for Name: global_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.global_settings VALUES ('5b5818ee-9b2f-414a-b510-000beb67b5e8', 'featured_max_per_category', '10', 'featured', 'Máx destacados por categoría', 'Cantidad máxima de avisos destacados simultáneos por categoría en la homepage', 'number', true, '2026-01-19 18:52:02.63721+00', NULL);
INSERT INTO public.global_settings VALUES ('eb168f65-09ce-48f7-97f2-8c3eb8650b6e', 'homepage_featured_ads_limit', '10', 'featured', 'Límite de avisos destacados en Home', 'Cantidad máxima de avisos destacados por categoría en HomePage (sincronizado con featured_slots_homepage)', 'number', true, '2026-02-04 20:33:08.806555+00', NULL);
INSERT INTO public.global_settings VALUES ('5e82caad-4606-4e62-8e56-4713fb3a85c3', 'ads_max_per_user_premium', '"15"', 'ads', 'Avisos máx (premium)', 'Cantidad máxima de avisos para usuarios premium', 'number', true, '2026-02-06 00:36:25.473708+00', NULL);
INSERT INTO public.global_settings VALUES ('43e23ad7-528e-425b-b506-f4ea42cabe45', 'contacts_max_per_day_premium', '"20"', 'contacts', 'Contactos diarios (premium)', 'Límite de contactos por día para usuarios premium', 'number', true, '2026-01-21 11:40:09.661602+00', NULL);
INSERT INTO public.global_settings VALUES ('f22f8d24-b0f5-4f2d-ada6-86bdac7efd7a', 'site_maintenance_mode', '"false"', 'general', 'Modo mantenimiento', 'Si está activo, solo admins pueden acceder', 'boolean', true, '2026-02-07 19:11:54.74353+00', NULL);
INSERT INTO public.global_settings VALUES ('c9197cfc-50dd-4a80-9844-c914e363d796', 'banners_intercalation_interval', '"8"', 'banners', 'Intervalo de Banners Intercalados', 'Cada cuántos productos se intercala un banner en resultados de búsqueda', 'number', true, '2026-02-02 22:24:47.503611+00', NULL);
INSERT INTO public.global_settings VALUES ('57441f6f-0ae0-43e5-9844-fa50aae7605a', 'images_max_per_ad', '"5"', 'images', 'Imágenes por aviso', 'Cantidad máxima de imágenes por aviso', 'number', true, '2026-02-07 19:12:13.854744+00', NULL);
INSERT INTO public.global_settings VALUES ('7aaf58d7-e58b-4882-8bf5-1f8ad4d0ae9d', 'analytics_enabled', '"true"', 'analytics', 'Analytics habilitado', 'Mostrar estadísticas de vistas a todos los usuarios', 'boolean', true, '2026-02-03 22:01:10.819467+00', NULL);
INSERT INTO public.global_settings VALUES ('20c93bbd-c855-46f3-bca6-f3032fd29391', 'images_max_size_mb', '"5"', 'images', 'Tamaño máximo (MB)', 'Tamaño máximo de imagen en MB', 'number', true, '2026-02-13 13:32:11.465094+00', NULL);
INSERT INTO public.global_settings VALUES ('85cb4a74-15f0-4d27-a95b-985b01982066', 'new_user_default_plan', '"\"starter\""', 'plans', 'Plan por defecto nuevos usuarios', 'Plan asignado automáticamente a usuarios nuevos', 'string', false, '2026-02-21 22:00:22.791901+00', NULL);
INSERT INTO public.global_settings VALUES ('cc70b88d-0e92-425d-a168-492ddb71f715', 'contacts_max_per_day_free', '"10"', 'contacts', 'Contactos diarios (gratuito)', 'Límite de contactos por día para usuarios gratuitos', 'number', true, '2026-02-21 22:00:47.096614+00', NULL);
INSERT INTO public.global_settings VALUES ('06ff65f0-4a93-4847-b35e-ff90c31e8268', 'contacts_reset_day', '"1"', 'contacts', 'Día de reset mensual', 'Día del mes en que se reinician los contadores de contactos', 'number', false, '2026-02-21 22:00:58.042333+00', NULL);
INSERT INTO public.global_settings VALUES ('eb7dbd31-67ce-40cc-9be9-93f46aea535e', 'ads_max_per_user_free', '"3"', 'ads', 'Avisos máx (gratuito)', 'Cantidad máxima de avisos para usuarios gratuitos', 'number', true, '2026-02-21 22:01:30.351584+00', NULL);
INSERT INTO public.global_settings VALUES ('a26d971b-4fff-445c-848d-68a23803119f', 'ads_expiration_days', '"30"', 'ads', 'Días de vigencia', 'Días antes de que expire un aviso', 'number', true, '2026-02-21 22:02:04.572567+00', NULL);
INSERT INTO public.global_settings VALUES ('5e60e9b9-6322-4129-a71d-4146ff961f74', 'featured_slots_homepage', '10', 'featured', 'Slots Homepage por categoría', 'Cantidad máxima de avisos destacados por categoría en homepage', 'number', true, '2026-02-04 20:08:28.531544+00', NULL);
INSERT INTO public.global_settings VALUES ('62383682-cca2-4bca-b1c1-94abb3cab7d4', 'featured_duration_days', '15', 'featured', 'Duración destacado (días)', 'Cantidad de días que dura un aviso destacado', 'number', true, '2026-02-04 20:08:28.531544+00', NULL);
INSERT INTO public.global_settings VALUES ('5ea038bd-fa21-49a4-8d7e-799ddd5df0e1', 'featured_promo_enabled', 'true', 'featured', 'Promoción activa', 'Habilita la promoción de créditos gratuitos de lanzamiento', 'boolean', true, '2026-02-07 21:15:07.331949+00', NULL);
INSERT INTO public.global_settings VALUES ('93391929-68e7-4fd4-abc9-8207c96c6470', 'featured_promo_end', '"2026-03-31"', 'featured', 'Fin promoción', 'Fecha de fin de la promoción de créditos', 'string', false, '2026-02-07 21:15:07.331949+00', NULL);
INSERT INTO public.global_settings VALUES ('616579e7-0e34-4d80-af31-c8c657df0eeb', 'featured_promo_message', '"🎉 ¡Lanzamiento! Recibí 3 créditos GRATIS para destacar tus avisos"', 'featured', 'Mensaje promocional', 'Mensaje que se muestra a usuarios sobre la promoción', 'string', true, '2026-02-07 21:15:07.331949+00', NULL);
INSERT INTO public.global_settings VALUES ('c1416d68-feea-4ac9-af6b-24c5627644b5', 'featured_credit_price', '"1000"', 'featured', 'Precio por crédito (ARS)', 'Precio de un crédito para destacar aviso', 'number', false, '2026-02-13 13:30:21.940473+00', NULL);
INSERT INTO public.global_settings VALUES ('5edb5b45-0c4e-4b17-bccb-c7a131e0c38b', 'featured_credit_pack_5_price', '"5000"', 'featured', 'Pack 5 créditos (ARS)', 'Precio del pack de 5 créditos', 'number', false, '2026-02-13 13:30:22.977659+00', NULL);
INSERT INTO public.global_settings VALUES ('55ec0523-0e58-4f1e-ad83-ebd719862be1', 'featured_credit_pack_10_price', '"10000"', 'featured', 'Pack 10 créditos (ARS)', 'Precio del pack de 10 créditos con descuento', 'number', false, '2026-02-13 13:30:24.374772+00', NULL);
INSERT INTO public.global_settings VALUES ('1dfb6936-834f-4db6-aaf1-b3d24ae0d577', 'featured_promo_credits', '"10"', 'featured', 'Créditos promocionales', 'Cantidad de créditos gratuitos que recibe cada usuario durante la promoción', 'number', true, '2026-02-13 13:30:42.776991+00', NULL);
INSERT INTO public.global_settings VALUES ('913cf35f-59c8-41a0-a624-56c6ad29667d', 'featured_slots_detail', '"8"', 'featured', 'Slots Detalle', 'Cantidad de avisos destacados relacionados en página de detalle', 'number', true, '2026-02-13 13:31:44.396298+00', NULL);
INSERT INTO public.global_settings VALUES ('248b3169-a26e-4e2a-967e-8d66fdfa427b', 'featured_promo_start', '"\"2026-02-20\""', 'featured', 'Inicio promoción', 'Fecha de inicio de la promoción de créditos', 'string', false, '2026-02-21 22:02:30.641316+00', NULL);
INSERT INTO public.global_settings VALUES ('45ca4a67-d050-4383-ba5d-038e1fc571e6', 'featured_slots_results', '"5"', 'featured', 'Slots Resultados', 'Cantidad de avisos destacados en página de resultados', 'number', true, '2026-02-21 22:03:26.262437+00', NULL);
INSERT INTO public.global_settings VALUES ('053c9d6e-8a95-42c9-9601-39a87a4a418e', 'featured_payments_enabled', '"false"', 'payments', 'Cobros Destacados Habilitados', 'Activa o desactiva checkout para avisos destacados', 'boolean', true, '2026-02-27 12:22:18.713608+00', NULL);
INSERT INTO public.global_settings VALUES ('d174c51d-de11-446b-ad65-4006787d915f', 'mercadopago_enabled', '"false"', 'payments', 'MercadoPago Habilitado', 'Muestra MercadoPago como método de pago', 'boolean', true, '2026-02-27 12:22:19.490672+00', NULL);
INSERT INTO public.global_settings VALUES ('bfce81de-a538-4dab-aba3-d5bdda21b0a4', 'mercadopago_sandbox_mode', '"true"', 'payments', 'MercadoPago Sandbox', 'Usa entorno de prueba en lugar de producción', 'boolean', false, '2026-02-27 12:22:19.767998+00', NULL);
INSERT INTO public.global_settings VALUES ('29b04f4d-5186-4a13-9586-ab07e40fe59a', 'wallet_virtual_enabled', 'true', 'payments', NULL, 'Permite usar ARS virtual en destacados', 'string', false, '2026-02-27 12:47:41.60595+00', NULL);
INSERT INTO public.global_settings VALUES ('7f7b8695-ee2b-4ed1-9333-3f56c8ea0558', 'wallet_real_enabled', 'false', 'payments', NULL, 'Permite usar ARS real (pasarela)', 'string', false, '2026-02-27 12:47:41.60595+00', NULL);
INSERT INTO public.global_settings VALUES ('ab2be70e-bb2e-466a-a488-b69ddc520df8', 'featured_checkout_mode', '"virtual_only"', 'payments', NULL, 'virtual_only | hybrid | real_only', 'string', false, '2026-02-27 12:47:41.60595+00', NULL);


--
-- Data for Name: models; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.models VALUES ('c2b3b5d6-0972-4a03-b928-bb4d17a5bfbd', '551fa38e-c714-48b5-b475-a6dbd23ae456', '5075E', '5075e', 2015, NULL, true, '{"peso": "3200 kg", "motor": "4.5L 4 cilindros turbo", "potencia": "75 HP", "transmision": "PowrReverser 16F/16R", "capacidad_elevacion": "2200 kg"}', '{"Cabina ROPS","Dirección hidrostática","Toma de fuerza","4 ruedas motrices"}', 'Tractor utilitario versátil ideal para fincas medianas. Perfecto balance entre potencia y economía.', NULL, '{}', true, '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');
INSERT INTO public.models VALUES ('b569b09a-2e72-4ee6-9bd2-5936769a3914', 'f5e11de0-b9c6-41df-8544-648ebd33a1c3', 'T7.270', 't7-270', 2018, NULL, true, '{"peso": "9850 kg", "motor": "FPT 6.7L 6 cilindros", "potencia": "270 HP", "transmision": "Auto Command CVT"}', '{"Cabina Horizon","Suspensión neumática","GPS IntelliSteer","Control avanzado"}', 'Tractor de alta potencia con tecnología CVT. Ideal para grandes explotaciones.', NULL, '{}', true, '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');
INSERT INTO public.models VALUES ('0decdd2a-32b9-4d7e-8364-aa3fc6def7fb', '0e64cdba-a515-4bdc-9bbe-93b14fd1f15c', '4275', '4275', 2010, NULL, true, '{"peso": "3100 kg", "motor": "Perkins 4.4L 4 cilindros", "potencia": "75 HP", "transmision": "8F/8R sincronizada"}', '{"Cabina con A/C","Dirección asistida","Toma de fuerza 540/1000 RPM","Muy confiable"}', 'Modelo clásico muy popular en Argentina. Robusto y económico de mantener.', NULL, '{}', true, '2026-01-04 14:27:33.169593+00', '2026-01-04 14:27:33.169593+00');


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.subcategories VALUES ('84b6062e-24ed-46af-845b-8915bb63d228', '6fd68a5b-4236-48ad-b8c3-57dcdbbcb6bf', 'para-la-hacienda', 'Para la Hacienda', NULL, NULL, true, 999, '2026-02-04 11:37:42.602024+00', '2026-02-04 11:37:42.602024+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('88c96ea7-76ea-44e5-96e5-219ebaa233e5', '6fd68a5b-4236-48ad-b8c3-57dcdbbcb6bf', 'aguayenerga', 'Agua y Energía', NULL, NULL, true, 999, '2026-02-04 12:04:25.034087+00', '2026-02-04 12:04:25.034087+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('f25b396e-62c6-4c45-bdea-ba58ea9b07ba', '92f47089-0073-4df0-bb3d-60f17152fd75', 'siembra', 'Siembra', NULL, NULL, true, 999, '2026-02-04 12:40:55.29721+00', '2026-02-04 12:40:55.29721+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('b87e7aac-c9bc-4cbb-9e85-dc84a170d3a4', '92f47089-0073-4df0-bb3d-60f17152fd75', 'pulverizacion', 'Pulverización terrestre / aéreo', NULL, NULL, true, 999, '2026-02-04 12:41:58.169577+00', '2026-02-04 12:41:58.169577+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('ddef4b14-16a7-4688-8108-f3fffc1aa603', '92f47089-0073-4df0-bb3d-60f17152fd75', 'concesionarias-maquinarias', 'Concesionarias en Maquinarias', NULL, NULL, true, 999, '2026-02-04 12:44:33.929127+00', '2026-02-04 12:44:33.929127+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('9d1a71ae-e463-4f23-a062-4461c2e3ba05', '92f47089-0073-4df0-bb3d-60f17152fd75', 'distribuidoresdeinsumos', 'Distribuidores de insumos', NULL, NULL, true, 999, '2026-02-04 12:45:23.866206+00', '2026-02-04 12:45:23.866206+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('9efbacab-9f61-4064-80f5-c254ccf3b326', '92f47089-0073-4df0-bb3d-60f17152fd75', 'consignatarias-de-hacienda', 'Consignatarias de hacienda', NULL, NULL, true, 999, '2026-02-04 12:46:21.212584+00', '2026-02-04 12:46:21.212584+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('ddbeb6da-a353-4170-9fb2-50f730ceb96a', '92f47089-0073-4df0-bb3d-60f17152fd75', 'comercializacin-granos', 'Acopio y comercialización de granos', NULL, NULL, true, 999, '2026-02-04 12:48:01.674196+00', '2026-02-04 12:48:01.674196+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('100371df-1481-49a3-b8f2-77aecf002913', '3773410d-505b-4cfc-874a-865cfe1370d6', 'cosechadoras', 'Cosechadoras', 'Cosechadoras y equipos de cosecha', NULL, true, 2, '2025-12-20 12:44:40.328333+00', '2025-12-20 12:44:40.328333+00', 'cosechadoras', true, true, true, true);
INSERT INTO public.subcategories VALUES ('a472b690-51b3-4e82-86a6-681c9bdca451', '3773410d-505b-4cfc-874a-865cfe1370d6', 'pulverizadoras', 'Pulverizadoras', 'Equipos de pulverización', NULL, true, 3, '2025-12-20 12:44:40.328333+00', '2025-12-20 12:44:40.328333+00', 'pulverizadoras', true, true, true, true);
INSERT INTO public.subcategories VALUES ('ddbecbc3-a1dd-4fc9-a48e-488d162de35b', '3773410d-505b-4cfc-874a-865cfe1370d6', 'sembradoras', 'Sembradoras', 'Equipos de siembra', NULL, true, 4, '2025-12-20 12:44:40.328333+00', '2025-12-20 12:44:40.328333+00', 'sembradoras', true, true, true, true);
INSERT INTO public.subcategories VALUES ('fb28c103-89b9-44f6-a9f3-f593df67161a', '9b98e866-5aca-4d58-874b-dc91c30acf1f', 'ovinos', 'Ovinos', 'Corderos, Borregos, Ovejas, Carneros, Capones, Majadas...', NULL, true, 999, '2025-12-24 18:37:10.266888+00', '2025-12-24 18:37:10.266888+00', 'ovinos', false, false, true, true);
INSERT INTO public.subcategories VALUES ('736a436b-525d-4896-9362-b8a26cd2424b', '9b98e866-5aca-4d58-874b-dc91c30acf1f', 'aves', 'Aves', NULL, NULL, true, 999, '2025-12-24 18:51:01.822669+00', '2025-12-24 18:51:01.822669+00', 'aves', false, false, true, true);
INSERT INTO public.subcategories VALUES ('a6e7aaf8-1920-4aa8-9ae3-ccdbe9a58246', '9b98e866-5aca-4d58-874b-dc91c30acf1f', 'bovinos', 'Bovinos', 'Toro, Ternero, Vaca, Vaquillona, Novillo, Novillito, Ternera

', NULL, true, 999, '2025-12-22 22:02:20.240024+00', '2025-12-22 22:02:20.240024+00', 'bovinos', false, false, true, true);
INSERT INTO public.subcategories VALUES ('fa50f076-7aca-4e8d-8dce-9e34834785e7', '9b98e866-5aca-4d58-874b-dc91c30acf1f', 'porcinos', 'Porcinos', 'Cerda, Verraco, Lechones, Marranos, Cerdos, Mini pigs', NULL, true, 999, '2025-12-24 18:50:06.292234+00', '2025-12-24 18:50:06.292234+00', 'porcinos', false, false, true, true);
INSERT INTO public.subcategories VALUES ('a91c1c63-e7e3-4b2f-a833-2ec6fa17eda0', '9b98e866-5aca-4d58-874b-dc91c30acf1f', 'equinos', 'Equinos', 'Caballo, Burro, Mula
', NULL, true, 999, '2025-12-24 18:50:25.168636+00', '2025-12-24 18:50:25.168636+00', 'equinos', false, false, true, true);
INSERT INTO public.subcategories VALUES ('b0508ef8-12cd-4186-a013-00cda7125b96', '9b98e866-5aca-4d58-874b-dc91c30acf1f', 'caprinos', 'Caprinos', 'Cabrito, cabra, cabrio', NULL, true, 999, '2025-12-24 18:50:41.893634+00', '2025-12-24 18:50:41.893634+00', 'caprinos', false, false, true, true);
INSERT INTO public.subcategories VALUES ('129c86f5-8806-4d19-8b8c-6b680f0bd93e', '3773410d-505b-4cfc-874a-865cfe1370d6', 'tractores', 'Tractores', 'Chico, medianos, grandes', NULL, true, 1, '2025-12-20 12:44:40.328333+00', '2025-12-20 12:44:40.328333+00', 'tractores', true, true, true, true);
INSERT INTO public.subcategories VALUES ('c8db27e1-a9f1-437f-bfbd-fc17df85d243', '65284d0d-79cd-432e-a166-102f43dba5fa', 'estancias', 'Estancias', NULL, NULL, true, 999, '2026-01-21 20:39:33.860347+00', '2026-01-21 20:39:33.860347+00', 'estancias', false, false, false, false);
INSERT INTO public.subcategories VALUES ('b4d88643-9113-4d5f-97e9-2b988c717f75', '65284d0d-79cd-432e-a166-102f43dba5fa', 'cabanas', 'Cabañas', NULL, NULL, true, 999, '2026-01-21 20:40:50.250401+00', '2026-01-21 20:40:50.250401+00', 'cabanas', false, false, false, false);
INSERT INTO public.subcategories VALUES ('99195194-ebfe-44df-85c8-26d0903e8bce', '65284d0d-79cd-432e-a166-102f43dba5fa', 'campos', 'Campos', 'Campo agrícola, ganadero, mixto, forestal, chacra...', NULL, true, 999, '2026-01-08 22:31:59.495903+00', '2026-01-08 22:31:59.495903+00', 'campos', false, false, false, false);
INSERT INTO public.subcategories VALUES ('c9d14324-5f1d-4527-9288-9a8c2bdbfb8f', '65284d0d-79cd-432e-a166-102f43dba5fa', 'lotesrurales', 'Lotes Rurales', 'Fracciones, Parcelas, Lotes productivos', NULL, true, 999, '2026-01-08 22:33:25.470825+00', '2026-01-08 22:33:25.470825+00', 'lotes-rurales', false, false, false, false);
INSERT INTO public.subcategories VALUES ('d205abd0-ec47-4da6-ad3c-c1e7a67ddbf0', '65284d0d-79cd-432e-a166-102f43dba5fa', 'quintas', 'Quintas', NULL, NULL, true, 999, '2026-01-15 16:14:38.950602+00', '2026-01-15 16:14:38.950602+00', 'quintas', false, false, false, false);
INSERT INTO public.subcategories VALUES ('9a0c289b-4a88-48fd-b6a3-56be9cf8a7a5', '65284d0d-79cd-432e-a166-102f43dba5fa', 'chacras', 'Chacras', NULL, NULL, true, 999, '2026-01-15 16:15:29.172109+00', '2026-01-15 16:15:29.172109+00', 'chacras', false, false, false, false);
INSERT INTO public.subcategories VALUES ('0720e6a8-246c-412c-ad97-626fef0a18ee', '3773410d-505b-4cfc-874a-865cfe1370d6', 'rastras', 'Rastras', NULL, NULL, true, 999, '2026-01-14 19:42:10.676392+00', '2026-01-14 19:42:10.676392+00', 'rastras', false, false, false, false);
INSERT INTO public.subcategories VALUES ('d9fa1e2f-7c6f-425d-818b-6475695a9e20', '3773410d-505b-4cfc-874a-865cfe1370d6', 'arados', 'Arados', 'De discos, De rejas, Cincel

', NULL, true, 999, '2026-01-14 19:41:55.485572+00', '2026-01-14 19:41:55.485572+00', 'arados', false, false, false, false);
INSERT INTO public.subcategories VALUES ('1c52212a-c85d-45ca-9a15-c5e3f79385da', '3773410d-505b-4cfc-874a-865cfe1370d6', 'camiones-camionetas', 'Camiones y Camionetas', NULL, NULL, true, 999, '2026-01-15 15:46:10.398712+00', '2026-01-15 15:46:10.398712+00', 'camiones-camionetas', false, false, false, false);
INSERT INTO public.subcategories VALUES ('d917e833-5cd1-4d1c-851a-5bb7ca2f77f0', '3773410d-505b-4cfc-874a-865cfe1370d6', 'fertilizadoras', 'Fertilizadoras', 'Al voleo, Neumática, Arrastre, 3 puntos, Autopropulsada

', NULL, true, 999, '2026-01-14 19:44:05.706995+00', '2026-01-14 19:44:05.706995+00', 'fertilizadoras', false, false, false, false);
INSERT INTO public.subcategories VALUES ('e4a2e40f-bfe4-4758-86fc-211a828289e1', '3773410d-505b-4cfc-874a-865cfe1370d6', 'tolvas', 'Tolvas', 'Tolva fija, basculante, plegable, con tapa,  con reja, autodescargable, con sinfín

', NULL, true, 999, '2026-01-14 19:44:21.845914+00', '2026-01-14 19:44:21.845914+00', 'tolvas', false, false, false, false);
INSERT INTO public.subcategories VALUES ('e0185830-28d5-4e64-af51-7ad37a2570cc', '6fd68a5b-4236-48ad-b8c3-57dcdbbcb6bf', 'proteccincultivo', 'Protección al Cultivo', 'Herbicidas, Insecticidas, Fungicidas, Terápicos de semilla, Adyuvantes, Biológicos...', NULL, true, 999, '2026-01-16 14:25:48.183394+00', '2026-01-16 14:25:48.183394+00', 'semillas-pasturas', false, false, false, false);
INSERT INTO public.subcategories VALUES ('90f007d4-f7ce-4ce2-8821-1ff0505ba736', '6fd68a5b-4236-48ad-b8c3-57dcdbbcb6bf', 'alambrados-y-cercos', 'Alambrados y Cercos', NULL, NULL, true, 999, '2026-02-04 11:58:18.204626+00', '2026-02-04 11:58:18.204626+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('7c16bf02-9e15-4d42-ab90-42a0b9f9057e', '6fd68a5b-4236-48ad-b8c3-57dcdbbcb6bf', 'herramientas-y-galpon', 'Herramientas y Galpón', NULL, NULL, true, 999, '2026-02-04 12:07:50.88789+00', '2026-02-04 12:07:50.88789+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('ee426093-c487-4171-8396-7dd9e8c399d2', '92f47089-0073-4df0-bb3d-60f17152fd75', 'cosecha', 'Cosecha', NULL, NULL, true, 999, '2026-02-04 12:41:22.001168+00', '2026-02-04 12:41:22.001168+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('fe5d4987-1d54-451a-b6e2-73c3ab1cd3a2', '92f47089-0073-4df0-bb3d-60f17152fd75', 'fertilizacion', 'Fertilización', NULL, NULL, true, 999, '2026-02-04 12:42:45.68889+00', '2026-02-04 12:42:45.68889+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('f9b9f4bd-79cd-47b9-a65c-848610093876', '92f47089-0073-4df0-bb3d-60f17152fd75', 'agronomas', 'Agronomías', NULL, NULL, true, 999, '2026-02-04 12:44:58.203502+00', '2026-02-04 12:44:58.203502+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('398c9f6a-c781-446d-bd61-1b148729fbc9', '92f47089-0073-4df0-bb3d-60f17152fd75', 'cooperativas-agropecuarias', 'Cooperativas agropecuarias', NULL, NULL, true, 999, '2026-02-04 12:45:55.04855+00', '2026-02-04 12:45:55.04855+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('7d81579b-096b-4fd2-b033-d3e6dc7266cb', '92f47089-0073-4df0-bb3d-60f17152fd75', 'veterinarias', 'Veterinarias', NULL, NULL, true, 999, '2026-02-04 12:47:17.127438+00', '2026-02-04 12:47:17.127438+00', NULL, false, false, false, false);
INSERT INTO public.subcategories VALUES ('71ea0bec-d665-4db5-a8d6-bd1aa14eee65', '92f47089-0073-4df0-bb3d-60f17152fd75', 'administracion-de-campos', 'Administración de campos', NULL, NULL, true, 999, '2026-02-04 12:48:56.015686+00', '2026-02-04 12:48:56.015686+00', NULL, false, false, false, false);


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.subscription_plans VALUES ('e1a0632a-71a3-49f9-bf85-e7bc17c9eccb', 'premium_empresa', 'Premium Empresa', NULL, NULL, NULL, 10, 0, true, true, true, false, true, true, false, 100000.00, 0.00, 'ARS', false, 3, '2025-12-27 16:31:14.434982+00', '2026-02-13 16:31:19.89+00', NULL, '', '["50 avisos activos", "1 Catálogo de Avisos"]', 'gold', 'building2', 'Más vendido', true, 0, 0, false, false, 'premium_empresa', 0, 30);
INSERT INTO public.subscription_plans VALUES ('bb5d8149-8059-4f27-b2c6-e569a8f264ed', 'pro', 'Lote 10 Avisos', 10, NULL, NULL, 1, 0, false, true, false, false, false, false, false, 0.00, 0.00, 'ARS', true, 3, '2026-01-19 18:53:18.538274+00', '2026-02-13 16:35:37.325+00', 20, '', '["Estadísticas avanzadas", "Publicación anónima", "Soporte prioritario", "1o avisos activos"]', 'gold', 'sparkles', '', false, 5, 30, true, true, 'pro', 3, 30);
INSERT INTO public.subscription_plans VALUES ('66cb2c86-6b34-4d48-82be-8e7012e959f0', 'free', 'Gratis', 0, 3, 3, 0, 0, false, true, false, false, false, false, false, 0.00, 0.00, 'ARS', false, 1, '2025-12-27 16:31:14.434982+00', '2026-02-21 21:57:39.195+00', 0, 'Plan básico para comenzar a publicar', '[]', 'gray', 'gift', '', false, 0, 0, false, false, 'free', 0, 30);
INSERT INTO public.subscription_plans VALUES ('fb9a2dd0-e076-46c2-be29-67272db3e626', 'starter', 'Lote 5 Avisos', 5, NULL, NULL, 1, 0, false, true, true, false, true, false, false, 50000.00, 0.00, 'ARS', true, 2, '2026-01-19 18:53:18.538274+00', '2026-02-21 21:59:25.822+00', 10, '', '["Estadísticas completas", "Publicación anónima", "1 Cupón para destacar aviso"]', 'green', 'zap', 'Gratis', true, 2, 10, true, true, 'starter', 0, 30);


--
-- PostgreSQL database dump complete
--

\unrestrict IaOEKxEdhfKwpYi4wXcyTsZwcqJhUDeW04dDwXll1LBK5SknwmwNjS0gVcGXV5U

