--
-- PostgreSQL database dump
--

\restrict vByKl9IQgvMZbRCgDfmttEu0leTeGmL1cf1gP9AUWnT0hMlatF67ViYz0vLGAVz

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
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.coupons VALUES ('4689fcb7-84e1-4ae0-9507-7db7986ede8c', 'R24CREDI', 'Campaña Rural24 - 001', 'Le da la bienvenida RURAL24', '¡Nueva espacio de clasificados para el Campo 2026! 
Recibí 24 créditos gratis para destacar tus avisos. ¡Gracias por ser parte de nuestra comunidad!', 24, NULL, 100, 1, '2026-03-11 05:59:00+00', true, 'fadd0359-ae43-4cad-9612-cbd639583196', '2026-02-08 22:27:43.320767+00', '2026-02-13 17:54:12.978508+00', true, false, false, '{}');
INSERT INTO public.coupons VALUES ('00e6b63e-bce0-481e-82df-c7828a118e06', '765177', 'para el Super admin', 'para el Super admin', NULL, 50, NULL, 100, 0, '2026-05-27 19:57:00+00', false, 'fadd0359-ae43-4cad-9612-cbd639583196', '2026-02-16 16:58:16.29953+00', '2026-02-23 12:43:04.261325+00', true, false, false, '{}');
INSERT INTO public.coupons VALUES ('df455996-bb7f-4c7d-95ef-f4de8e4211ef', 'SUPER', 'cupon para SUPERADMIN', 'Creditos par ausar para el supreadmin', 'Para usar en etapa lanzamiento', 50, NULL, 100, 1, '2026-05-15 14:31:00+00', true, 'fadd0359-ae43-4cad-9612-cbd639583196', '2026-02-23 11:32:26.030987+00', '2026-02-26 15:49:30.734774+00', true, false, false, '{}');


--
-- Data for Name: user_credits; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.user_credits VALUES ('31f3a155-773a-437e-9a45-7a3966eb733e', '11d8354a-007e-47cb-be42-089d22a5b789', 24, 0, NULL, '2026-02-08 22:07:30.933931+00', '2026-02-08 22:07:30.933931+00');
INSERT INTO public.user_credits VALUES ('8e9c8585-28a6-43d1-a008-707ba20c31f0', '588f6751-650a-4f4a-b50a-854cbcafd080', 32, 0, NULL, '2026-02-08 22:21:16.661977+00', '2026-02-11 15:21:17.594433+00');


--
-- PostgreSQL database dump complete
--

\unrestrict vByKl9IQgvMZbRCgDfmttEu0leTeGmL1cf1gP9AUWnT0hMlatF67ViYz0vLGAVz

