-- ============================================
-- RURAL24 - Complete Database Schema Export
-- Date: 2026-02-12T12:50:46.094Z
-- Source: Supabase (lmkuecdvxtenrikjomol)
-- ============================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Drop existing tables
DROP TABLE IF EXISTS public.ad_images CASCADE;
DROP TABLE IF EXISTS public.ads CASCADE;
DROP TABLE IF EXISTS public.ads_moderation_log CASCADE;
DROP TABLE IF EXISTS public.attribute_groups CASCADE;
DROP TABLE IF EXISTS public.attribute_options CASCADE;
DROP TABLE IF EXISTS public.attribute_template_fields CASCADE;
DROP TABLE IF EXISTS public.attribute_templates CASCADE;
DROP TABLE IF EXISTS public.attributes CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.banners_clean CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.catalog_items CASCADE;
DROP TABLE IF EXISTS public.catalogs CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.category_icons CASCADE;
DROP TABLE IF EXISTS public.category_types CASCADE;
DROP TABLE IF EXISTS public.cms_footer CASCADE;
DROP TABLE IF EXISTS public.cms_footer_columns CASCADE;
DROP TABLE IF EXISTS public.cms_footer_links CASCADE;
DROP TABLE IF EXISTS public.cms_header CASCADE;
DROP TABLE IF EXISTS public.cms_hero_images CASCADE;
DROP TABLE IF EXISTS public.cms_nav_items CASCADE;
DROP TABLE IF EXISTS public.cms_search_config CASCADE;
DROP TABLE IF EXISTS public.cms_social_media CASCADE;
DROP TABLE IF EXISTS public.cms_stats CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.contact_notifications CASCADE;
DROP TABLE IF EXISTS public.coupon_invitations CASCADE;
DROP TABLE IF EXISTS public.coupon_redemptions CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.dynamic_attributes CASCADE;
DROP TABLE IF EXISTS public.featured_ads CASCADE;
DROP TABLE IF EXISTS public.featured_ads_audit CASCADE;
DROP TABLE IF EXISTS public.featured_ads_queue CASCADE;
DROP TABLE IF EXISTS public.global_config CASCADE;
DROP TABLE IF EXISTS public.global_settings CASCADE;
DROP TABLE IF EXISTS public.hero_images CASCADE;
DROP TABLE IF EXISTS public.images CASCADE;
DROP TABLE IF EXISTS public.jobs_log CASCADE;
DROP TABLE IF EXISTS public.membership_plans CASCADE;
DROP TABLE IF EXISTS public.models CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profile_contacts CASCADE;
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.sources CASCADE;
DROP TABLE IF EXISTS public.subcategories CASCADE;
DROP TABLE IF EXISTS public.subcategory_attributes CASCADE;
DROP TABLE IF EXISTS public.subcategory_brands CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;
DROP TABLE IF EXISTS public.user_featured_credits CASCADE;
DROP TABLE IF EXISTS public.user_promo_claims CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

CREATE TABLE public.ad_images (id uuid NOT NULL DEFAULT gen_random_uuid(), ad_id uuid NOT NULL, url text NOT NULL, sort_order integer DEFAULT 0, created_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.ad_images ADD CONSTRAINT ad_images_pkey PRIMARY KEY (id);


CREATE TABLE public.ads (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid, category_id uuid NOT NULL, subcategory_id uuid, title character varying(200) NOT NULL, description text, price numeric, currency character varying(3) DEFAULT 'ARS'::character varying, province character varying(100), city character varying(100), attributes jsonb DEFAULT '{}'::jsonb, status character varying(20) DEFAULT 'pending'::character varying, is_premium boolean DEFAULT false, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), published_at timestamp with time zone, expires_at timestamp with time zone, search_vector tsvector, featured boolean DEFAULT false, approval_status text DEFAULT 'pending'::text, images jsonb DEFAULT '[]'::jsonb, location text, contact_phone text, contact_email text, views integer DEFAULT 0, featured_at timestamp without time zone, featured_order integer, brand_id uuid, model_id uuid, category_type_id uuid, year integer, condition character varying(50), dynamic_fields jsonb DEFAULT '{}'::jsonb, slug character varying(200) NOT NULL, short_id character varying(8) NOT NULL, featured_until timestamp with time zone, price_negotiable boolean DEFAULT false, in_sitemap boolean DEFAULT false, sitemap_added_at timestamp with time zone, sitemap_added_by uuid, category character varying(255), subcategory character varying(255), ad_type character varying(20) DEFAULT 'product'::character varying, company_profile_id uuid);

ALTER TABLE ONLY public.ads ADD CONSTRAINT ads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ads ADD CONSTRAINT ads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands (id);
ALTER TABLE ONLY public.ads ADD CONSTRAINT ads_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id);
ALTER TABLE ONLY public.ads ADD CONSTRAINT ads_category_type_id_fkey FOREIGN KEY (category_type_id) REFERENCES public.category_types (id);
ALTER TABLE ONLY public.ads ADD CONSTRAINT ads_company_profile_id_fkey FOREIGN KEY (company_profile_id) REFERENCES public.company_profiles (id);
ALTER TABLE ONLY public.ads ADD CONSTRAINT ads_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.models (id);
ALTER TABLE ONLY public.ads ADD CONSTRAINT ads_sitemap_added_by_fkey FOREIGN KEY (sitemap_added_by) REFERENCES public.users (id);
ALTER TABLE ONLY public.ads ADD CONSTRAINT ads_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories (id);

CREATE TABLE public.ads_moderation_log (id uuid NOT NULL DEFAULT gen_random_uuid(), ad_id uuid, moderator_id uuid, action text NOT NULL, reason text, created_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.ads_moderation_log ADD CONSTRAINT ads_moderation_log_pkey PRIMARY KEY (id);


CREATE TABLE public.attribute_groups (id uuid NOT NULL DEFAULT gen_random_uuid(), subcategory_id uuid NOT NULL, name character varying(100) NOT NULL, display_name character varying(100) NOT NULL, sort_order integer NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.attribute_groups ADD CONSTRAINT attribute_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.attribute_groups ADD CONSTRAINT attribute_groups_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories (id) ON DELETE CASCADE;

CREATE TABLE public.attribute_options (id uuid NOT NULL DEFAULT gen_random_uuid(), attribute_id uuid NOT NULL, value character varying(100) NOT NULL, label character varying(100) NOT NULL, display_order integer DEFAULT 0, is_active boolean DEFAULT true, metadata jsonb, created_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.attribute_options ADD CONSTRAINT attribute_options_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.attribute_options ADD CONSTRAINT attribute_options_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes (id) ON DELETE CASCADE;

CREATE TABLE public.attribute_template_fields (id uuid NOT NULL DEFAULT gen_random_uuid(), template_id uuid NOT NULL, field_name text NOT NULL, field_label text NOT NULL, field_type text NOT NULL, field_group text NOT NULL, field_options jsonb, is_required boolean DEFAULT false, min_value numeric, max_value numeric, placeholder text, help_text text, prefix text, suffix text, sort_order integer NOT NULL DEFAULT 1, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.attribute_template_fields ADD CONSTRAINT attribute_template_fields_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.attribute_template_fields ADD CONSTRAINT attribute_template_fields_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.attribute_templates (id) ON DELETE CASCADE;

CREATE TABLE public.attribute_templates (id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL, description text, category_id uuid, subcategory_id uuid, created_by uuid, is_active boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.attribute_templates ADD CONSTRAINT attribute_templates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.attribute_templates ADD CONSTRAINT attribute_templates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.attribute_templates ADD CONSTRAINT attribute_templates_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories (id) ON DELETE SET NULL;

CREATE TABLE public.attributes (id uuid NOT NULL DEFAULT gen_random_uuid(), slug character varying(100) NOT NULL, name character varying(100) NOT NULL, description text, input_type character varying(50) NOT NULL, data_type character varying(20) NOT NULL, ui_config jsonb DEFAULT '{}'::jsonb, validations jsonb DEFAULT '{}'::jsonb, is_filterable boolean DEFAULT true, is_searchable boolean DEFAULT false, is_featured boolean DEFAULT false, display_order integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.attributes ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


CREATE TABLE public.banners (id uuid NOT NULL DEFAULT gen_random_uuid(), type text NOT NULL, title text NOT NULL, image_url text NOT NULL, link_url text, category text, device_target text NOT NULL DEFAULT 'both'::text, is_active boolean DEFAULT true, impressions integer DEFAULT 0, clicks integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), display_order integer DEFAULT 0, is_priority boolean DEFAULT false, "position" text, priority_weight integer DEFAULT 0);

ALTER TABLE ONLY public.banners ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


CREATE TABLE public.banners_clean (id uuid NOT NULL DEFAULT uuid_generate_v4(), placement USER-DEFINED NOT NULL, category character varying(100), client_name character varying(255) NOT NULL, link_url text, desktop_image_url text, mobile_image_url text, carousel_image_url text, starts_at timestamp with time zone, expires_at timestamp with time zone, is_active boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), impressions integer DEFAULT 0, clicks integer DEFAULT 0);

ALTER TABLE ONLY public.banners_clean ADD CONSTRAINT banners_clean_pkey PRIMARY KEY (id);


CREATE TABLE public.brands (id uuid NOT NULL DEFAULT uuid_generate_v4(), name character varying(200) NOT NULL, slug character varying(200), logo_url text, website text, country character varying(100), description text, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, metadata jsonb DEFAULT '{}'::jsonb, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.brands ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


CREATE TABLE public.catalog_items (id uuid NOT NULL DEFAULT gen_random_uuid(), catalog_id uuid NOT NULL, title character varying(200) NOT NULL, description text, images jsonb DEFAULT '[]'::jsonb, price numeric, currency character varying(3) DEFAULT 'USD'::character varying, price_type character varying(20) DEFAULT 'fixed'::character varying, specs jsonb DEFAULT '{}'::jsonb, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, views_count integer DEFAULT 0, contact_count integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.catalog_items ADD CONSTRAINT catalog_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.catalog_items ADD CONSTRAINT catalog_items_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES public.catalogs (id) ON DELETE CASCADE;

CREATE TABLE public.catalogs (id uuid NOT NULL DEFAULT gen_random_uuid(), company_id uuid NOT NULL, name character varying(150) NOT NULL, slug character varying(150) NOT NULL, description text, cover_image_url text, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.catalogs ADD CONSTRAINT catalogs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.catalogs ADD CONSTRAINT catalogs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company_profiles (id) ON DELETE CASCADE;

CREATE TABLE public.categories (id uuid NOT NULL DEFAULT gen_random_uuid(), name text NOT NULL, display_name text NOT NULL, description text, icon text, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), slug character varying(100));

ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_v2_pkey PRIMARY KEY (id);


CREATE TABLE public.category_icons (id uuid NOT NULL DEFAULT gen_random_uuid(), name character varying(100) NOT NULL, url_light character varying(500) NOT NULL, url_dark character varying(500), storage_path character varying(300), created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), title text, paragraph text);

ALTER TABLE ONLY public.category_icons ADD CONSTRAINT category_icons_pkey PRIMARY KEY (id);


CREATE TABLE public.category_types (id uuid NOT NULL DEFAULT gen_random_uuid(), category_id uuid NOT NULL, subcategory_id uuid, name text NOT NULL, display_name text NOT NULL, description text, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), slug character varying(100));

ALTER TABLE ONLY public.category_types ADD CONSTRAINT category_types_v2_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.category_types ADD CONSTRAINT category_types_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.category_types ADD CONSTRAINT category_types_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories (id) ON DELETE CASCADE;

CREATE TABLE public.cms_footer (id uuid NOT NULL DEFAULT gen_random_uuid(), logo_url text DEFAULT '/images/logos/logo.svg'::text, logo_alt text DEFAULT 'Clasify'::text, description character varying(300) DEFAULT 'Conectando el Campo'::character varying, show_social_media boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), logo_width integer DEFAULT 100, logo_height integer DEFAULT 100, show_logo boolean DEFAULT true, logo_original_width integer, logo_original_height integer);

ALTER TABLE ONLY public.cms_footer ADD CONSTRAINT cms_footer_pkey PRIMARY KEY (id);


CREATE TABLE public.cms_footer_columns (id uuid NOT NULL DEFAULT gen_random_uuid(), title character varying(100) NOT NULL, column_type character varying(20) DEFAULT 'manual'::character varying, display_order integer DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.cms_footer_columns ADD CONSTRAINT cms_footer_columns_pkey PRIMARY KEY (id);


CREATE TABLE public.cms_footer_links (id uuid NOT NULL DEFAULT gen_random_uuid(), column_id uuid, label character varying(100) NOT NULL, url text NOT NULL, display_order integer DEFAULT 0, is_active boolean DEFAULT true, open_new_tab boolean DEFAULT false, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.cms_footer_links ADD CONSTRAINT cms_footer_links_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cms_footer_links ADD CONSTRAINT cms_footer_links_column_id_fkey FOREIGN KEY (column_id) REFERENCES public.cms_footer_columns (id) ON DELETE CASCADE;

CREATE TABLE public.cms_header (id uuid NOT NULL DEFAULT gen_random_uuid(), logo_url text NOT NULL DEFAULT '/images/logos/logo.svg'::text, logo_alt text DEFAULT 'Clasify'::text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), logo_width integer DEFAULT 100, logo_height integer DEFAULT 100, logo_dark_url text, favicon_url text DEFAULT '/favicon.ico'::text, show_logo boolean DEFAULT true, click_action text DEFAULT 'homepage'::text, custom_url text, logo_original_width integer, logo_original_height integer);

ALTER TABLE ONLY public.cms_header ADD CONSTRAINT cms_header_pkey PRIMARY KEY (id);


CREATE TABLE public.cms_hero_images (id uuid NOT NULL DEFAULT gen_random_uuid(), image_url text NOT NULL, alt_text text, overlay_color character varying(50) DEFAULT 'rgba(0,0,0,0.3)'::character varying, overlay_opacity numeric DEFAULT 0.30, display_order integer NOT NULL DEFAULT 0, is_active boolean DEFAULT true, fade_duration integer DEFAULT 5000, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.cms_hero_images ADD CONSTRAINT cms_hero_images_pkey PRIMARY KEY (id);


CREATE TABLE public.cms_nav_items (id uuid NOT NULL DEFAULT gen_random_uuid(), label character varying(100) NOT NULL, url text NOT NULL, is_active boolean DEFAULT true, display_order integer NOT NULL DEFAULT 0, open_new_tab boolean DEFAULT false, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.cms_nav_items ADD CONSTRAINT cms_nav_items_pkey PRIMARY KEY (id);


CREATE TABLE public.cms_search_config (id uuid NOT NULL DEFAULT gen_random_uuid(), title character varying(200) DEFAULT 'Encontrá lo que necesitás para tu campo'::character varying, subtitle character varying(300) DEFAULT 'Miles de productos agrícolas, maquinarias y servicios en un solo lugar'::character varying, show_stats boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.cms_search_config ADD CONSTRAINT cms_search_config_pkey PRIMARY KEY (id);


CREATE TABLE public.cms_social_media (id uuid NOT NULL DEFAULT gen_random_uuid(), platform character varying(50) NOT NULL, url text NOT NULL, icon_svg text, display_order integer DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.cms_social_media ADD CONSTRAINT cms_social_media_pkey PRIMARY KEY (id);


CREATE TABLE public.cms_stats (id uuid NOT NULL DEFAULT gen_random_uuid(), label character varying(50) NOT NULL, value_type character varying(20) DEFAULT 'dynamic'::character varying, static_value character varying(50), display_order integer DEFAULT 0, is_active boolean DEFAULT true, base_value integer DEFAULT 0, variation_mode character varying(20) DEFAULT 'percentage'::character varying, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), image_stat text);

ALTER TABLE ONLY public.cms_stats ADD CONSTRAINT cms_stats_pkey PRIMARY KEY (id);


CREATE TABLE public.company_profiles (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid NOT NULL, company_name character varying(200) NOT NULL, slug character varying(200) NOT NULL, logo_url text, banner_url text, description text, contact_first_name character varying(100) NOT NULL, contact_last_name character varying(100) NOT NULL, contact_phone character varying(50), contact_whatsapp character varying(50), contact_email character varying(150), allow_whatsapp boolean DEFAULT true, allow_contact_form boolean DEFAULT true, province character varying(100), city character varying(100), address text, services_offered jsonb DEFAULT '[]'::jsonb, business_hours jsonb, website_url text, facebook_url text, instagram_url text, is_active boolean DEFAULT true, is_verified boolean DEFAULT false, verified_at timestamp with time zone, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.company_profiles ADD CONSTRAINT company_profiles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.company_profiles ADD CONSTRAINT company_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE TABLE public.contact_messages (id uuid NOT NULL DEFAULT gen_random_uuid(), ad_id uuid NOT NULL, ad_owner_id uuid NOT NULL, sender_name text NOT NULL, sender_last_name text, sender_phone text, sender_email text NOT NULL, message text NOT NULL, is_read boolean DEFAULT false, created_at timestamp with time zone DEFAULT now(), read_at timestamp with time zone, sender_user_id uuid, status character varying(20) DEFAULT 'active'::character varying, is_blocked boolean DEFAULT false, blocked_reason character varying(50), thread_id uuid, parent_message_id uuid, is_reply boolean DEFAULT false);

ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_ad_owner_id_fkey FOREIGN KEY (ad_owner_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES public.contact_messages (id);
ALTER TABLE ONLY public.contact_messages ADD CONSTRAINT contact_messages_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.users (id) ON DELETE SET NULL;

CREATE TABLE public.contact_notifications (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid NOT NULL, contact_message_id uuid NOT NULL, type character varying(50) NOT NULL, title character varying(200) NOT NULL, message text NOT NULL, is_read boolean DEFAULT false, is_email_sent boolean DEFAULT false, email_sent_at timestamp with time zone, created_at timestamp with time zone DEFAULT now(), read_at timestamp with time zone);

ALTER TABLE ONLY public.contact_notifications ADD CONSTRAINT contact_notifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.contact_notifications ADD CONSTRAINT contact_notifications_contact_message_id_fkey FOREIGN KEY (contact_message_id) REFERENCES public.contact_messages (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.contact_notifications ADD CONSTRAINT contact_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE TABLE public.coupon_invitations (id uuid NOT NULL DEFAULT gen_random_uuid(), coupon_id uuid NOT NULL, email character varying(255) NOT NULL, invited_by uuid NOT NULL, token character varying(100) NOT NULL, status character varying(20) NOT NULL DEFAULT 'pending'::character varying, sent_at timestamp with time zone NOT NULL DEFAULT now(), used_at timestamp with time zone, used_by uuid);

ALTER TABLE ONLY public.coupon_invitations ADD CONSTRAINT coupon_invitations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.coupon_invitations ADD CONSTRAINT coupon_invitations_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons (id) ON DELETE CASCADE;

CREATE TABLE public.coupon_redemptions (id uuid NOT NULL DEFAULT gen_random_uuid(), coupon_id uuid NOT NULL, user_id uuid NOT NULL, credits_granted integer NOT NULL DEFAULT 0, membership_granted uuid, redeemed_at timestamp with time zone NOT NULL DEFAULT now());

ALTER TABLE ONLY public.coupon_redemptions ADD CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.coupon_redemptions ADD CONSTRAINT coupon_redemptions_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.coupon_redemptions ADD CONSTRAINT coupon_redemptions_membership_granted_fkey FOREIGN KEY (membership_granted) REFERENCES public.membership_plans (id) ON DELETE SET NULL;

CREATE TABLE public.coupons (id uuid NOT NULL DEFAULT gen_random_uuid(), code character varying(50) NOT NULL, name character varying(100) NOT NULL, title character varying(150) NOT NULL, description text, credits_amount integer NOT NULL DEFAULT 0, membership_id uuid, max_redemptions integer NOT NULL DEFAULT 1, current_redemptions integer NOT NULL DEFAULT 0, expires_at timestamp with time zone NOT NULL, is_active boolean NOT NULL DEFAULT true, created_by uuid NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now(), gives_credits boolean DEFAULT true, gives_membership boolean DEFAULT false, membership_all boolean DEFAULT false, membership_plan_ids ARRAY DEFAULT '{}'::uuid[]);

ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.membership_plans (id) ON DELETE SET NULL;

CREATE TABLE public.credit_transactions (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid NOT NULL, type character varying(20) NOT NULL, amount integer NOT NULL, balance_after integer NOT NULL, description text NOT NULL, payment_id uuid, featured_ad_id uuid, promo_code character varying(50), notes text, created_at timestamp with time zone NOT NULL DEFAULT now());

ALTER TABLE ONLY public.credit_transactions ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.credit_transactions ADD CONSTRAINT credit_transactions_featured_ad_id_fkey FOREIGN KEY (featured_ad_id) REFERENCES public.featured_ads (id) ON DELETE SET NULL;
ALTER TABLE ONLY public.credit_transactions ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE TABLE public.dynamic_attributes (id uuid NOT NULL DEFAULT gen_random_uuid(), category_id uuid, subcategory_id uuid, type_id uuid, field_name text NOT NULL, field_label text NOT NULL, field_type text NOT NULL, field_group text, field_options jsonb, is_required boolean DEFAULT false, min_value numeric, max_value numeric, validation_regex text, placeholder text, help_text text, prefix text, suffix text, sort_order integer DEFAULT 0, is_active boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), is_filterable boolean DEFAULT false, filter_type character varying(20) DEFAULT 'select'::character varying, filter_order integer DEFAULT 99, group_id uuid);

ALTER TABLE ONLY public.dynamic_attributes ADD CONSTRAINT dynamic_attributes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.dynamic_attributes ADD CONSTRAINT dynamic_attributes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.dynamic_attributes ADD CONSTRAINT dynamic_attributes_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.attribute_groups (id) ON DELETE SET NULL;
ALTER TABLE ONLY public.dynamic_attributes ADD CONSTRAINT dynamic_attributes_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.dynamic_attributes ADD CONSTRAINT dynamic_attributes_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.category_types (id) ON DELETE CASCADE;

CREATE TABLE public.featured_ads (id uuid NOT NULL DEFAULT gen_random_uuid(), ad_id uuid NOT NULL, user_id uuid NOT NULL, placement character varying(20) NOT NULL, category_id uuid NOT NULL, scheduled_start date NOT NULL, actual_start timestamp with time zone, expires_at timestamp with time zone, duration_days integer NOT NULL DEFAULT 15, status character varying(20) NOT NULL DEFAULT 'pending'::character varying, priority integer DEFAULT 0, credit_consumed boolean DEFAULT false, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), transaction_id uuid, cancelled_by uuid, cancelled_reason text, refunded boolean DEFAULT false, cancelled_at timestamp with time zone, is_manual boolean DEFAULT false, manual_activated_by uuid, requires_payment boolean DEFAULT true, admin_notes text, credits_spent integer);

ALTER TABLE ONLY public.featured_ads ADD CONSTRAINT featured_ads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.featured_ads ADD CONSTRAINT featured_ads_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.featured_ads ADD CONSTRAINT featured_ads_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users (id);
ALTER TABLE ONLY public.featured_ads ADD CONSTRAINT featured_ads_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id);
ALTER TABLE ONLY public.featured_ads ADD CONSTRAINT featured_ads_manual_activated_by_fkey FOREIGN KEY (manual_activated_by) REFERENCES public.users (id);
ALTER TABLE ONLY public.featured_ads ADD CONSTRAINT featured_ads_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.credit_transactions (id);
ALTER TABLE ONLY public.featured_ads ADD CONSTRAINT featured_ads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE TABLE public.featured_ads_audit (id uuid NOT NULL DEFAULT gen_random_uuid(), featured_ad_id uuid, action character varying(50) NOT NULL, performed_by uuid, reason text, metadata jsonb, created_at timestamp with time zone NOT NULL DEFAULT now(), ad_id uuid, user_id uuid, performer_email character varying(255), performer_name character varying(255), performer_role character varying(20));

ALTER TABLE ONLY public.featured_ads_audit ADD CONSTRAINT featured_ads_audit_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.featured_ads_audit ADD CONSTRAINT featured_ads_audit_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads (id) ON DELETE SET NULL;
ALTER TABLE ONLY public.featured_ads_audit ADD CONSTRAINT featured_ads_audit_featured_ad_id_fkey FOREIGN KEY (featured_ad_id) REFERENCES public.featured_ads (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.featured_ads_audit ADD CONSTRAINT featured_ads_audit_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users (id);
ALTER TABLE ONLY public.featured_ads_audit ADD CONSTRAINT featured_ads_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE SET NULL;

CREATE TABLE public.featured_ads_queue (id uuid NOT NULL DEFAULT gen_random_uuid(), ad_id uuid NOT NULL, category_id uuid NOT NULL, user_id uuid NOT NULL, requested_at timestamp with time zone DEFAULT now(), scheduled_start date, scheduled_end date, status character varying(20) DEFAULT 'queued'::character varying, payment_id uuid, notified_start boolean DEFAULT false, notified_end_soon boolean DEFAULT false, notified_end boolean DEFAULT false, admin_notes text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.featured_ads_queue ADD CONSTRAINT featured_ads_queue_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.featured_ads_queue ADD CONSTRAINT featured_ads_queue_ad_id_fkey FOREIGN KEY (ad_id) REFERENCES public.ads (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.featured_ads_queue ADD CONSTRAINT featured_ads_queue_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id);
ALTER TABLE ONLY public.featured_ads_queue ADD CONSTRAINT featured_ads_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);
ALTER TABLE ONLY public.featured_ads_queue ADD CONSTRAINT fk_featured_queue_payment FOREIGN KEY (payment_id) REFERENCES public.payments (id);

CREATE TABLE public.global_config (id uuid NOT NULL DEFAULT gen_random_uuid(), key character varying(100) NOT NULL, value text NOT NULL, value_type character varying(20) NOT NULL, description text, category character varying(50), updated_at timestamp with time zone NOT NULL DEFAULT now(), created_at timestamp with time zone NOT NULL DEFAULT now());

ALTER TABLE ONLY public.global_config ADD CONSTRAINT global_config_pkey PRIMARY KEY (id);


CREATE TABLE public.global_settings (id uuid NOT NULL DEFAULT gen_random_uuid(), key character varying(100) NOT NULL, value jsonb NOT NULL, category character varying(50) NOT NULL DEFAULT 'general'::character varying, display_name character varying(200), description text, value_type character varying(20) DEFAULT 'string'::character varying, is_public boolean DEFAULT false, updated_at timestamp with time zone DEFAULT now(), updated_by uuid);

ALTER TABLE ONLY public.global_settings ADD CONSTRAINT global_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.global_settings ADD CONSTRAINT global_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users (id);

CREATE TABLE public.hero_images (id uuid NOT NULL DEFAULT gen_random_uuid(), image_url text NOT NULL, alt_text text, display_order integer NOT NULL DEFAULT 0, is_active boolean DEFAULT true, fade_duration integer DEFAULT 5000, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), title text, subtitle text, cta_text text DEFAULT 'Ver más'::text, cta_url text, slide_duration integer DEFAULT 5000);

ALTER TABLE ONLY public.hero_images ADD CONSTRAINT hero_images_pkey PRIMARY KEY (id);


CREATE TABLE public.images (id uuid NOT NULL DEFAULT gen_random_uuid(), listing_id uuid, listing_type character varying(50) NOT NULL, original_url text NOT NULL, optimized_url text, thumbnail_url text, width integer, height integer, file_size integer, optimized_size integer, format character varying(10), hash character varying(64), perceptual_hash character varying(64), is_optimized boolean DEFAULT false, display_order integer DEFAULT 0, alt_text text, metadata jsonb DEFAULT '{}'::jsonb, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()));

ALTER TABLE ONLY public.images ADD CONSTRAINT images_pkey PRIMARY KEY (id);


CREATE TABLE public.jobs_log (id uuid NOT NULL DEFAULT gen_random_uuid(), job_name character varying(255) NOT NULL, job_type character varying(100) NOT NULL, source_id uuid, status character varying(50) NOT NULL, message text, items_processed integer DEFAULT 0, items_success integer DEFAULT 0, items_failed integer DEFAULT 0, execution_time_ms integer, error_details jsonb, metadata jsonb DEFAULT '{}'::jsonb, started_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), finished_at timestamp with time zone, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()));

ALTER TABLE ONLY public.jobs_log ADD CONSTRAINT jobs_log_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.jobs_log ADD CONSTRAINT jobs_log_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources (id) ON DELETE SET NULL;

CREATE TABLE public.membership_plans (id uuid NOT NULL DEFAULT gen_random_uuid(), name character varying(255) NOT NULL, slug character varying(100) NOT NULL, description text, price numeric, is_active boolean DEFAULT true, monthly_free_credits integer DEFAULT 0, monthly_credits_expire_days integer DEFAULT 30, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.membership_plans ADD CONSTRAINT membership_plans_pkey PRIMARY KEY (id);


CREATE TABLE public.models (id uuid NOT NULL DEFAULT uuid_generate_v4(), brand_id uuid NOT NULL, name character varying(200) NOT NULL, slug character varying(200), year_from integer, year_to integer, is_current_production boolean DEFAULT true, specifications jsonb DEFAULT '{}'::jsonb, features ARRAY DEFAULT '{}'::text[], short_description text, main_image_url text, gallery_images ARRAY DEFAULT '{}'::text[], is_active boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.models ADD CONSTRAINT models_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.models ADD CONSTRAINT models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands (id) ON DELETE CASCADE;

CREATE TABLE public.payments (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid NOT NULL, payment_type character varying(30) NOT NULL, amount numeric NOT NULL, currency character varying(3) DEFAULT 'ARS'::character varying, status character varying(20) DEFAULT 'pending'::character varying, payment_method character varying(30) DEFAULT 'simulated'::character varying, external_id character varying(255), external_status character varying(100), description text, metadata jsonb DEFAULT '{}'::jsonb, receipt_number character varying(50), receipt_url text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), completed_at timestamp with time zone, expires_at timestamp with time zone, admin_notes text);

ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);

CREATE TABLE public.products (id uuid NOT NULL DEFAULT gen_random_uuid(), title text NOT NULL, description text NOT NULL, price numeric, currency text NOT NULL DEFAULT 'USD'::text, location text NOT NULL, image_url text NOT NULL, source_url text NOT NULL, category text NOT NULL, is_sponsored boolean DEFAULT false, enriched_data jsonb, created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP, updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP);

ALTER TABLE ONLY public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);


CREATE TABLE public.profile_contacts (id uuid NOT NULL DEFAULT gen_random_uuid(), profile_user_id uuid NOT NULL, sender_user_id uuid, sender_first_name character varying(100) NOT NULL, sender_last_name character varying(100) NOT NULL, sender_phone character varying(50) NOT NULL, sender_email character varying(255) NOT NULL, message text NOT NULL, source_type character varying(50) DEFAULT 'profile'::character varying, source_ad_id uuid, status character varying(20) DEFAULT 'unread'::character varying, read_at timestamp with time zone, replied_at timestamp with time zone, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.profile_contacts ADD CONSTRAINT profile_contacts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profile_contacts ADD CONSTRAINT profile_contacts_profile_user_id_fkey FOREIGN KEY (profile_user_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.profile_contacts ADD CONSTRAINT profile_contacts_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.users (id) ON DELETE SET NULL;
ALTER TABLE ONLY public.profile_contacts ADD CONSTRAINT profile_contacts_source_ad_id_fkey FOREIGN KEY (source_ad_id) REFERENCES public.ads (id) ON DELETE SET NULL;

CREATE TABLE public.profile_views (id uuid NOT NULL DEFAULT gen_random_uuid(), profile_user_id uuid NOT NULL, visitor_user_id uuid, visitor_ip character varying(45), visitor_user_agent text, source_type character varying(50) DEFAULT 'direct'::character varying, source_ad_id uuid, source_url text, created_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.profile_views ADD CONSTRAINT profile_views_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.profile_views ADD CONSTRAINT profile_views_profile_user_id_fkey FOREIGN KEY (profile_user_id) REFERENCES public.users (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.profile_views ADD CONSTRAINT profile_views_source_ad_id_fkey FOREIGN KEY (source_ad_id) REFERENCES public.ads (id) ON DELETE SET NULL;
ALTER TABLE ONLY public.profile_views ADD CONSTRAINT profile_views_visitor_user_id_fkey FOREIGN KEY (visitor_user_id) REFERENCES public.users (id) ON DELETE SET NULL;

CREATE TABLE public.site_settings (id uuid NOT NULL DEFAULT gen_random_uuid(), setting_key text NOT NULL, setting_value text, setting_type text NOT NULL, section text NOT NULL, description text, updated_by uuid, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.site_settings ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


CREATE TABLE public.sources (id uuid NOT NULL DEFAULT gen_random_uuid(), name character varying(255) NOT NULL, url text NOT NULL, base_url text NOT NULL, scraper_type character varying(100) NOT NULL, is_active boolean DEFAULT true, scraping_interval integer DEFAULT 3600, last_scraped_at timestamp with time zone, total_listings_scraped integer DEFAULT 0, success_rate numeric DEFAULT 100.00, config jsonb DEFAULT '{}'::jsonb, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()));

ALTER TABLE ONLY public.sources ADD CONSTRAINT sources_pkey PRIMARY KEY (id);


CREATE TABLE public.subcategories (id uuid NOT NULL DEFAULT gen_random_uuid(), category_id uuid NOT NULL, name text NOT NULL, display_name text NOT NULL, description text, icon text, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), slug character varying(100), has_brands boolean DEFAULT false, has_models boolean DEFAULT false, has_year boolean DEFAULT false, has_condition boolean DEFAULT false);

ALTER TABLE ONLY public.subcategories ADD CONSTRAINT subcategories_v2_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.subcategories ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories (id) ON DELETE CASCADE;

CREATE TABLE public.subcategory_attributes (id uuid NOT NULL DEFAULT gen_random_uuid(), subcategory_id uuid NOT NULL, attribute_id uuid NOT NULL, is_required boolean DEFAULT false, display_order integer DEFAULT 0, field_group character varying(50) DEFAULT 'general'::character varying, override_config jsonb, created_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.subcategory_attributes ADD CONSTRAINT subcategory_attributes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.subcategory_attributes ADD CONSTRAINT subcategory_attributes_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes (id) ON DELETE CASCADE;

CREATE TABLE public.subcategory_brands (id uuid NOT NULL DEFAULT uuid_generate_v4(), subcategory_id uuid NOT NULL, brand_id uuid NOT NULL, sort_order integer DEFAULT 0, created_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.subcategory_brands ADD CONSTRAINT subcategory_brands_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.subcategory_brands ADD CONSTRAINT subcategory_brands_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands (id) ON DELETE CASCADE;
ALTER TABLE ONLY public.subcategory_brands ADD CONSTRAINT subcategory_brands_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories (id) ON DELETE CASCADE;

CREATE TABLE public.subscription_plans (id uuid NOT NULL DEFAULT gen_random_uuid(), name character varying(50) NOT NULL, display_name character varying(100) NOT NULL, max_ads integer DEFAULT 3, max_contacts_received integer, max_contacts_sent integer, max_featured_ads integer DEFAULT 0, max_highlighted_ads integer DEFAULT 0, can_publish_immediately boolean DEFAULT false, has_inbox boolean DEFAULT true, has_analytics boolean DEFAULT false, has_priority_support boolean DEFAULT false, has_public_profile boolean DEFAULT false, has_catalog boolean DEFAULT false, has_multiuser boolean DEFAULT false, price_monthly numeric DEFAULT 0, price_yearly numeric DEFAULT 0, currency character varying(3) DEFAULT 'ARS'::character varying, is_active boolean DEFAULT true, sort_order integer DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), max_contacts_per_month integer, description text, features jsonb DEFAULT '[]'::jsonb, badge_color character varying(20) DEFAULT 'gray'::character varying, icon_name character varying(50) DEFAULT 'gift'::character varying, badge_text character varying(100), is_featured boolean DEFAULT false, max_catalogs integer DEFAULT 0, max_catalog_items_per_catalog integer DEFAULT 0, can_have_company_profile boolean DEFAULT false, show_company_branding boolean DEFAULT false, slug character varying(50), monthly_free_credits integer DEFAULT 0, monthly_credits_expire_days integer DEFAULT 30);

ALTER TABLE ONLY public.subscription_plans ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


CREATE TABLE public.system_config (key text NOT NULL, value text NOT NULL, updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.system_config ADD CONSTRAINT system_config_pkey PRIMARY KEY (key);


CREATE TABLE public.user_credits (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid NOT NULL, balance integer NOT NULL DEFAULT 0, monthly_allowance integer DEFAULT 0, last_monthly_reset timestamp with time zone, created_at timestamp with time zone NOT NULL DEFAULT now(), updated_at timestamp with time zone NOT NULL DEFAULT now());

ALTER TABLE ONLY public.user_credits ADD CONSTRAINT user_credits_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_credits ADD CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE TABLE public.user_featured_credits (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid NOT NULL, credits_total integer NOT NULL DEFAULT 0, credits_used integer NOT NULL DEFAULT 0, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.user_featured_credits ADD CONSTRAINT user_featured_credits_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_featured_credits ADD CONSTRAINT user_featured_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE TABLE public.user_promo_claims (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid NOT NULL, promo_code character varying(50) NOT NULL DEFAULT 'launch_2026'::character varying, credits_granted integer NOT NULL, claimed_at timestamp with time zone DEFAULT now());

ALTER TABLE ONLY public.user_promo_claims ADD CONSTRAINT user_promo_claims_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_promo_claims ADD CONSTRAINT user_promo_claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

CREATE TABLE public.users (id uuid NOT NULL, email character varying(255) NOT NULL, full_name character varying(255) NOT NULL, phone character varying(20), role character varying(50) NOT NULL DEFAULT 'free'::character varying, is_verified boolean DEFAULT false, display_name character varying(255), company_tax_id character varying(50), location character varying(255), created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), email_verified boolean DEFAULT false, mobile text, user_type text DEFAULT 'particular'::text, province text, subscription_plan_id uuid, subscription_status character varying(20) DEFAULT 'active'::character varying, subscription_started_at timestamp with time zone, subscription_expires_at timestamp with time zone, subscription_auto_renew boolean DEFAULT true, custom_max_ads integer, custom_max_contacts integer, cuit character varying(13), verification_status character varying(20) DEFAULT 'verified'::character varying, verification_notes text, verified_by uuid, verified_at timestamp with time zone, first_name character varying(100), last_name character varying(100), contacts_used_this_month integer DEFAULT 0, contacts_reset_at timestamp with time zone, avatar_url text, bio text, services text, privacy_mode character varying(20) DEFAULT 'public'::character varying, profile_views integer DEFAULT 0, profile_contacts_received integer DEFAULT 0);

ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users ADD CONSTRAINT users_subscription_plan_id_fkey FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users (id);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_ad_images_ad_id ON public.ad_images USING btree (ad_id);
CREATE INDEX idx_ad_images_sort_order ON public.ad_images USING btree (ad_id, sort_order);
CREATE INDEX ads_seo_lookup ON public.ads USING btree (category_id, subcategory_id, slug, short_id);
CREATE UNIQUE INDEX ads_short_id_unique ON public.ads USING btree (short_id);
CREATE INDEX ads_slug_idx ON public.ads USING btree (slug);
CREATE INDEX idx_ads_admin_listing ON public.ads USING btree (created_at);
CREATE INDEX idx_ads_attributes ON public.ads USING gin (attributes);
CREATE INDEX idx_ads_brand ON public.ads USING btree (brand_id);
CREATE INDEX idx_ads_brand_model ON public.ads USING btree (brand_id, model_id);
CREATE INDEX idx_ads_by_user ON public.ads USING btree (user_id, created_at);
CREATE INDEX idx_ads_company ON public.ads USING btree (company_profile_id);
CREATE INDEX idx_ads_dynamic_fields ON public.ads USING gin (dynamic_fields);
CREATE INDEX idx_ads_featured ON public.ads USING btree (featured, category_id, featured_order);
CREATE INDEX idx_ads_featured_until ON public.ads USING btree (featured_until);
CREATE INDEX idx_ads_location ON public.ads USING btree (province, city);
CREATE INDEX idx_ads_model ON public.ads USING btree (model_id);
CREATE INDEX idx_ads_price ON public.ads USING btree (price);
CREATE INDEX idx_ads_price_negotiable ON public.ads USING btree (price_negotiable);
CREATE INDEX idx_ads_public_listing ON public.ads USING btree (status, expires_at, created_at);
CREATE INDEX idx_ads_published_at ON public.ads USING btree (published_at);
CREATE INDEX idx_ads_search ON public.ads USING gin (search_vector);
CREATE INDEX idx_ads_short_id ON public.ads USING btree (short_id);
CREATE INDEX idx_ads_sitemap ON public.ads USING btree (in_sitemap);
CREATE INDEX idx_ads_slug ON public.ads USING btree (slug);
CREATE INDEX idx_ads_status ON public.ads USING btree (status, published_at);
CREATE INDEX idx_ads_status_approval ON public.ads USING btree (status, approval_status);
CREATE INDEX idx_ads_subcategory ON public.ads USING btree (subcategory_id, status, published_at);
CREATE INDEX idx_ads_title ON public.ads USING btree (title);
CREATE INDEX idx_ads_type ON public.ads USING btree (ad_type);
CREATE INDEX idx_ads_user ON public.ads USING btree (user_id, status);
CREATE INDEX idx_ads_year ON public.ads USING btree (year);
CREATE INDEX idx_moderation_log_ad_id ON public.ads_moderation_log USING btree (ad_id);
CREATE INDEX idx_attribute_groups_sort ON public.attribute_groups USING btree (subcategory_id, sort_order);
CREATE INDEX idx_attribute_groups_subcategory ON public.attribute_groups USING btree (subcategory_id);
CREATE UNIQUE INDEX unique_group_per_subcategory ON public.attribute_groups USING btree (subcategory_id, name);
CREATE UNIQUE INDEX attribute_options_attribute_id_value_key ON public.attribute_options USING btree (attribute_id, value);
CREATE INDEX idx_attr_options_active ON public.attribute_options USING btree (attribute_id);
CREATE INDEX idx_attr_options_attribute ON public.attribute_options USING btree (attribute_id, display_order);
CREATE INDEX idx_template_fields_sort ON public.attribute_template_fields USING btree (template_id, sort_order);
CREATE INDEX idx_template_fields_template ON public.attribute_template_fields USING btree (template_id);
CREATE INDEX idx_templates_active ON public.attribute_templates USING btree (is_active);
CREATE INDEX idx_templates_category ON public.attribute_templates USING btree (category_id);
CREATE INDEX idx_templates_name ON public.attribute_templates USING btree (name);
CREATE INDEX idx_templates_subcategory ON public.attribute_templates USING btree (subcategory_id);
CREATE UNIQUE INDEX attributes_slug_key ON public.attributes USING btree (slug);
CREATE INDEX idx_attributes_filterable ON public.attributes USING btree (is_filterable);
CREATE INDEX idx_attributes_slug ON public.attributes USING btree (slug);
CREATE INDEX idx_attributes_type ON public.attributes USING btree (input_type);
CREATE INDEX idx_banners_active ON public.banners USING btree (is_active);
CREATE INDEX idx_banners_category ON public.banners USING btree (category);
CREATE INDEX idx_banners_device_target ON public.banners USING btree (device_target);
CREATE INDEX idx_banners_type ON public.banners USING btree (type);
CREATE INDEX idx_banners_type_category ON public.banners USING btree (type, category);
CREATE INDEX idx_banners_type_device ON public.banners USING btree (type, device_target);
CREATE INDEX idx_banners_type_device_active ON public.banners USING btree (type, device_target, is_active);
CREATE INDEX idx_banners_clean_active ON public.banners_clean USING btree (placement, category, is_active);
CREATE INDEX idx_banners_clean_expiration ON public.banners_clean USING btree (expires_at);
CREATE UNIQUE INDEX brands_slug_key ON public.brands USING btree (slug);
CREATE INDEX idx_brands_slug ON public.brands USING btree (slug);
CREATE INDEX idx_catalog_items_catalog ON public.catalog_items USING btree (catalog_id);
CREATE INDEX idx_catalogs_company ON public.catalogs USING btree (company_id);
CREATE UNIQUE INDEX unique_catalog_slug ON public.catalogs USING btree (company_id, slug);
CREATE UNIQUE INDEX categories_slug_unique ON public.categories USING btree (slug);
CREATE UNIQUE INDEX categories_v2_name_key ON public.categories USING btree (name);
CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);
CREATE INDEX idx_category_icons_name ON public.category_icons USING btree (name);
CREATE UNIQUE INDEX category_types_category_id_subcategory_id_name_key ON public.category_types USING btree (category_id, subcategory_id, name);
CREATE INDEX idx_category_types_slug ON public.category_types USING btree (subcategory_id, slug);
CREATE INDEX idx_category_types_subcategory ON public.category_types USING btree (subcategory_id);
CREATE INDEX idx_types_category ON public.category_types USING btree (category_id);
CREATE INDEX idx_types_subcategory ON public.category_types USING btree (subcategory_id);
CREATE UNIQUE INDEX idx_cms_footer_singleton ON public.cms_footer USING btree ();
CREATE INDEX idx_cms_footer_columns_active ON public.cms_footer_columns USING btree (is_active);
CREATE INDEX idx_cms_footer_columns_order ON public.cms_footer_columns USING btree (display_order);
CREATE INDEX idx_cms_footer_links_active ON public.cms_footer_links USING btree (is_active);
CREATE INDEX idx_cms_footer_links_column ON public.cms_footer_links USING btree (column_id);
CREATE INDEX idx_cms_footer_links_order ON public.cms_footer_links USING btree (display_order);
CREATE UNIQUE INDEX idx_cms_header_singleton ON public.cms_header USING btree ();
CREATE INDEX idx_cms_hero_active ON public.cms_hero_images USING btree (is_active);
CREATE INDEX idx_cms_hero_order ON public.cms_hero_images USING btree (display_order);
CREATE INDEX idx_cms_nav_items_active ON public.cms_nav_items USING btree (is_active);
CREATE INDEX idx_cms_nav_items_order ON public.cms_nav_items USING btree (display_order);
CREATE UNIQUE INDEX idx_cms_search_singleton ON public.cms_search_config USING btree ();
CREATE INDEX idx_cms_social_active ON public.cms_social_media USING btree (is_active);
CREATE INDEX idx_cms_social_order ON public.cms_social_media USING btree (display_order);
CREATE INDEX idx_cms_stats_active ON public.cms_stats USING btree (is_active);
CREATE INDEX idx_cms_stats_order ON public.cms_stats USING btree (display_order);
CREATE UNIQUE INDEX company_profiles_slug_key ON public.company_profiles USING btree (slug);
CREATE INDEX idx_company_profiles_slug ON public.company_profiles USING btree (slug);
CREATE INDEX idx_company_profiles_user ON public.company_profiles USING btree (user_id);
CREATE UNIQUE INDEX unique_user_company ON public.company_profiles USING btree (user_id);
CREATE INDEX idx_contact_messages_ad ON public.contact_messages USING btree (ad_id);
CREATE INDEX idx_contact_messages_ad_owner ON public.contact_messages USING btree (ad_owner_id, created_at);
CREATE INDEX idx_contact_messages_is_read ON public.contact_messages USING btree (ad_owner_id, is_read);
CREATE INDEX idx_contact_messages_receiver ON public.contact_messages USING btree (ad_owner_id, created_at);
CREATE INDEX idx_contact_messages_recipient_status ON public.contact_messages USING btree (ad_owner_id, status, is_read, created_at);
CREATE INDEX idx_contact_messages_sender ON public.contact_messages USING btree (sender_user_id, created_at);
CREATE INDEX idx_contact_messages_sender_status ON public.contact_messages USING btree (sender_user_id, status, created_at);
CREATE INDEX idx_contact_notifications_user ON public.contact_notifications USING btree (user_id, is_read, created_at);
CREATE UNIQUE INDEX coupon_invitations_token_key ON public.coupon_invitations USING btree (token);
CREATE INDEX idx_coupon_invitations_coupon ON public.coupon_invitations USING btree (coupon_id);
CREATE INDEX idx_coupon_invitations_email ON public.coupon_invitations USING btree (email);
CREATE INDEX idx_coupon_invitations_status ON public.coupon_invitations USING btree (status);
CREATE INDEX idx_coupon_invitations_token ON public.coupon_invitations USING btree (token);
CREATE UNIQUE INDEX coupon_redemptions_coupon_id_user_id_key ON public.coupon_redemptions USING btree (coupon_id, user_id);
CREATE INDEX idx_coupon_redemptions_coupon ON public.coupon_redemptions USING btree (coupon_id);
CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions USING btree (user_id);
CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);
CREATE INDEX idx_coupons_active ON public.coupons USING btree (is_active, expires_at);
CREATE INDEX idx_coupons_code ON public.coupons USING btree (code);
CREATE INDEX idx_coupons_created_by ON public.coupons USING btree (created_by);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions USING btree (created_at);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions USING btree (type);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions USING btree (user_id);
CREATE INDEX idx_attributes_category ON public.dynamic_attributes USING btree (category_id);
CREATE INDEX idx_attributes_subcategory ON public.dynamic_attributes USING btree (subcategory_id);
CREATE INDEX idx_dynamic_attributes_filterable ON public.dynamic_attributes USING btree (category_id, subcategory_id, is_filterable);
CREATE INDEX idx_dynamic_attributes_group ON public.dynamic_attributes USING btree (group_id);
CREATE INDEX idx_featured_ads_ad_id ON public.featured_ads USING btree (ad_id);
CREATE INDEX idx_featured_ads_category ON public.featured_ads USING btree (category_id);
CREATE INDEX idx_featured_ads_category_id ON public.featured_ads USING btree (category_id);
CREATE INDEX idx_featured_ads_expires ON public.featured_ads USING btree (expires_at);
CREATE INDEX idx_featured_ads_expires_at ON public.featured_ads USING btree (expires_at);
CREATE INDEX idx_featured_ads_is_manual ON public.featured_ads USING btree (is_manual);
CREATE INDEX idx_featured_ads_manual_activated_by ON public.featured_ads USING btree (manual_activated_by);
CREATE INDEX idx_featured_ads_placement ON public.featured_ads USING btree (placement);
CREATE INDEX idx_featured_ads_placement_category ON public.featured_ads USING btree (placement, category_id);
CREATE INDEX idx_featured_ads_placement_category_status ON public.featured_ads USING btree (placement, category_id, status);
CREATE INDEX idx_featured_ads_scheduled ON public.featured_ads USING btree (scheduled_start);
CREATE INDEX idx_featured_ads_scheduled_start ON public.featured_ads USING btree (scheduled_start);
CREATE INDEX idx_featured_ads_status ON public.featured_ads USING btree (status);
CREATE UNIQUE INDEX idx_featured_ads_unique_ad_placement ON public.featured_ads USING btree (ad_id, placement);
CREATE INDEX idx_featured_ads_user ON public.featured_ads USING btree (user_id);
CREATE INDEX idx_featured_ads_user_id ON public.featured_ads USING btree (user_id);
CREATE INDEX idx_featured_ads_user_status ON public.featured_ads USING btree (user_id, status);
CREATE INDEX idx_featured_ads_audit_action ON public.featured_ads_audit USING btree (action);
CREATE INDEX idx_featured_ads_audit_ad_id ON public.featured_ads_audit USING btree (ad_id);
CREATE INDEX idx_featured_ads_audit_created_at ON public.featured_ads_audit USING btree (created_at);
CREATE INDEX idx_featured_ads_audit_featured_ad ON public.featured_ads_audit USING btree (featured_ad_id);
CREATE INDEX idx_featured_ads_audit_featured_id ON public.featured_ads_audit USING btree (featured_ad_id);
CREATE INDEX idx_featured_ads_audit_performed_by ON public.featured_ads_audit USING btree (performed_by);
CREATE INDEX idx_featured_ads_audit_user_id ON public.featured_ads_audit USING btree (user_id);
CREATE INDEX idx_featured_queue_active ON public.featured_ads_queue USING btree (category_id, status);
CREATE INDEX idx_featured_queue_ad ON public.featured_ads_queue USING btree (ad_id);
CREATE INDEX idx_featured_queue_category ON public.featured_ads_queue USING btree (category_id);
CREATE INDEX idx_featured_queue_dates ON public.featured_ads_queue USING btree (scheduled_start, scheduled_end);
CREATE INDEX idx_featured_queue_status ON public.featured_ads_queue USING btree (status);
CREATE INDEX idx_featured_queue_user ON public.featured_ads_queue USING btree (user_id);
CREATE UNIQUE INDEX global_config_key_key ON public.global_config USING btree (key);
CREATE INDEX idx_global_config_category ON public.global_config USING btree (category);
CREATE INDEX idx_global_config_key ON public.global_config USING btree (key);
CREATE UNIQUE INDEX global_settings_key_key ON public.global_settings USING btree (key);
CREATE INDEX idx_global_settings_category ON public.global_settings USING btree (category);
CREATE INDEX idx_global_settings_key ON public.global_settings USING btree (key);
CREATE INDEX idx_hero_images_active ON public.hero_images USING btree (is_active);
CREATE INDEX idx_hero_images_active_order ON public.hero_images USING btree (is_active, display_order);
CREATE INDEX idx_hero_images_order ON public.hero_images USING btree (display_order);
CREATE INDEX idx_images_hash ON public.images USING btree (hash);
CREATE INDEX idx_images_is_optimized ON public.images USING btree (is_optimized);
CREATE INDEX idx_images_listing_id ON public.images USING btree (listing_id);
CREATE INDEX idx_images_listing_type ON public.images USING btree (listing_type);
CREATE INDEX idx_images_perceptual_hash ON public.images USING btree (perceptual_hash);
CREATE INDEX idx_jobs_log_job_name ON public.jobs_log USING btree (job_name);
CREATE INDEX idx_jobs_log_job_type ON public.jobs_log USING btree (job_type);
CREATE INDEX idx_jobs_log_source_id ON public.jobs_log USING btree (source_id);
CREATE INDEX idx_jobs_log_started_at ON public.jobs_log USING btree (started_at);
CREATE INDEX idx_jobs_log_status ON public.jobs_log USING btree (status);
CREATE UNIQUE INDEX membership_plans_slug_key ON public.membership_plans USING btree (slug);
CREATE INDEX idx_models_brand ON public.models USING btree (brand_id);
CREATE INDEX idx_models_production_years ON public.models USING btree (year_from, year_to);
CREATE INDEX idx_models_slug ON public.models USING btree (brand_id, slug);
CREATE INDEX idx_models_specifications ON public.models USING gin (specifications);
CREATE UNIQUE INDEX models_brand_id_slug_key ON public.models USING btree (brand_id, slug);
CREATE INDEX idx_payments_completed ON public.payments USING btree (completed_at);
CREATE INDEX idx_payments_created ON public.payments USING btree (created_at);
CREATE INDEX idx_payments_status ON public.payments USING btree (status);
CREATE INDEX idx_payments_type ON public.payments USING btree (payment_type);
CREATE INDEX idx_payments_user ON public.payments USING btree (user_id);
CREATE INDEX idx_products_category ON public.products USING btree (category);
CREATE INDEX idx_products_created_at ON public.products USING btree (created_at);
CREATE INDEX idx_products_is_sponsored ON public.products USING btree (is_sponsored);
CREATE INDEX idx_products_location ON public.products USING btree (location);
CREATE INDEX idx_profile_contacts_created ON public.profile_contacts USING btree (created_at);
CREATE INDEX idx_profile_contacts_profile_user ON public.profile_contacts USING btree (profile_user_id);
CREATE INDEX idx_profile_contacts_status ON public.profile_contacts USING btree (status);
CREATE INDEX idx_profile_views_created ON public.profile_views USING btree (created_at);
CREATE INDEX idx_profile_views_profile_user ON public.profile_views USING btree (profile_user_id);
CREATE INDEX idx_site_settings_key ON public.site_settings USING btree (setting_key);
CREATE INDEX idx_site_settings_section ON public.site_settings USING btree (section);
CREATE UNIQUE INDEX site_settings_setting_key_key ON public.site_settings USING btree (setting_key);
CREATE INDEX idx_sources_active ON public.sources USING btree (is_active);
CREATE INDEX idx_sources_last_scraped ON public.sources USING btree (last_scraped_at);
CREATE INDEX idx_sources_type ON public.sources USING btree (scraper_type);
CREATE UNIQUE INDEX sources_name_key ON public.sources USING btree (name);
CREATE INDEX idx_subcategories_slug ON public.subcategories USING btree (category_id, slug);
CREATE UNIQUE INDEX subcategories_category_id_name_key ON public.subcategories USING btree (category_id, name);
CREATE UNIQUE INDEX subcategories_category_slug_unique ON public.subcategories USING btree (category_id, slug);
CREATE INDEX idx_subcat_attrs_required ON public.subcategory_attributes USING btree (subcategory_id);
CREATE INDEX idx_subcat_attrs_subcat ON public.subcategory_attributes USING btree (subcategory_id, display_order);
CREATE UNIQUE INDEX subcategory_attributes_subcategory_id_attribute_id_key ON public.subcategory_attributes USING btree (subcategory_id, attribute_id);
CREATE INDEX idx_subcategory_brands_brand ON public.subcategory_brands USING btree (brand_id);
CREATE INDEX idx_subcategory_brands_subcategory ON public.subcategory_brands USING btree (subcategory_id);
CREATE UNIQUE INDEX subcategory_brands_subcategory_id_brand_id_key ON public.subcategory_brands USING btree (subcategory_id, brand_id);
CREATE UNIQUE INDEX subscription_plans_name_key ON public.subscription_plans USING btree (name);
CREATE INDEX idx_user_credits_user_id ON public.user_credits USING btree (user_id);
CREATE UNIQUE INDEX user_credits_user_id_key ON public.user_credits USING btree (user_id);
CREATE UNIQUE INDEX user_featured_credits_user_unique ON public.user_featured_credits USING btree (user_id);
CREATE INDEX idx_user_promo_claims_user ON public.user_promo_claims USING btree (user_id);
CREATE UNIQUE INDEX user_promo_claims_unique ON public.user_promo_claims USING btree (user_id, promo_code);
CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_email_verified ON public.users USING btree (email_verified);
CREATE INDEX idx_users_province ON public.users USING btree (province);
CREATE INDEX idx_users_role ON public.users USING btree (role);
CREATE INDEX idx_users_subscription_plan ON public.users USING btree (subscription_plan_id);
CREATE INDEX idx_users_verification_status ON public.users USING btree (verification_status, user_type);
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_sources_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_attribute_templates_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.set_featured_order()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si se marca como destacado y no tiene orden, asignar el siguiente disponible
  IF NEW.featured = TRUE AND NEW.featured_order IS NULL THEN
    SELECT COALESCE(MAX(featured_order), 0) + 1
    INTO NEW.featured_order
    FROM ads
    WHERE category_id = NEW.category_id
    AND featured = TRUE;
    
    NEW.featured_at := NOW();
  END IF;
  
  -- Si se desmarca, limpiar campos
  IF NEW.featured = FALSE THEN
    NEW.featured_order := NULL;
    NEW.featured_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_site_settings_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.is_superadmin_user()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('superadmin', 'super-admin')
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super-admin'
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_setting(key text)
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT setting_value FROM site_settings WHERE setting_key = key LIMIT 1;
$function$


CREATE OR REPLACE FUNCTION public.update_attribute_groups_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_category_ad_count(category_name text)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::INT 
    FROM ads 
    WHERE category = category_name 
    AND status = 'active'
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_settings_by_section(sec text)
 RETURNS TABLE(key text, value text, type text, description text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT setting_key, setting_value, setting_type, description
  FROM site_settings
  WHERE section = sec
  ORDER BY setting_key;
$function$


CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_environment_mode()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT value FROM public.system_config WHERE key = 'environment_mode';
$function$


CREATE OR REPLACE FUNCTION public.log_moderation_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Solo registrar si cambió el approval_status
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    INSERT INTO ads_moderation_log (ad_id, moderator_id, action, reason)
    VALUES (
      NEW.id,
      auth.uid(),
      CASE NEW.approval_status
        WHEN 'approved' THEN 'approved'
        WHEN 'rejected' THEN 'rejected'
        ELSE NULL
      END,
      NEW.rejection_reason
    );
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_coupons_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_full_name()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Concatenar first_name y last_name para crear full_name
  NEW.full_name := TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_global_settings_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.check_ad_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  user_role TEXT;
  max_ads INTEGER;
  current_ads_count INTEGER;
BEGIN
  -- Obtener rol de usuario
  SELECT u.role INTO user_role
  FROM public.users u
  WHERE u.id = NEW.user_id;

  -- Definir límites según rol
  -- MVP: Sin límites estrictos, todos pueden crear avisos
  max_ads := CASE 
    WHEN user_role = 'admin' THEN 999999
    WHEN user_role = 'user' THEN 999999  -- Sin límite en MVP
    ELSE 999999
  END;

  -- Contar avisos activos del usuario
  SELECT COUNT(*) INTO current_ads_count
  FROM public.ads
  WHERE user_id = NEW.user_id
    AND status IN ('active', 'paused');

  -- Validar límite
  IF current_ads_count >= max_ads THEN
    RAISE EXCEPTION 'Límite de avisos alcanzado. Tu plan permite % avisos activos.', max_ads;
  END IF;

  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_setting(setting_key character varying)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  SELECT value FROM global_settings WHERE key = setting_key;
$function$


CREATE OR REPLACE FUNCTION public.get_setting_int(setting_key character varying)
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
  SELECT (value #>> '{}')::INTEGER FROM global_settings WHERE key = setting_key;
$function$


CREATE OR REPLACE FUNCTION public.clean_price_decimals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si price es NOT NULL y es un entero (sin decimales significativos)
  IF NEW.price IS NOT NULL AND NEW.price = FLOOR(NEW.price) THEN
    -- Guardarlo sin decimales
    NEW.price := FLOOR(NEW.price);
  END IF;
  
  -- Si price_negotiable es TRUE, limpiar el precio
  IF NEW.price_negotiable = TRUE THEN
    NEW.price := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_setting_bool(setting_key character varying)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT (value #>> '{}')::BOOLEAN FROM global_settings WHERE key = setting_key;
$function$


CREATE OR REPLACE FUNCTION public.get_online_users_random()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  base INT;
  variation_factor DECIMAL;
  hour_slot INT;
  result INT;
BEGIN
  -- Obtener base_value de la stat "Online"
  SELECT base_value INTO base FROM cms_stats WHERE label = 'Online' LIMIT 1;
  
  IF base IS NULL THEN
    base := 15; -- Default
  END IF;

  -- Slot de 3 horas (0-7 = 8 slots en un día)
  hour_slot := (EXTRACT(HOUR FROM NOW())::INT / 3);

  -- Variación según slot (patron: -30%, +10%, +80%, +40%, repetir)
  CASE (hour_slot % 4)
    WHEN 0 THEN variation_factor := 0.70;  -- -30%
    WHEN 1 THEN variation_factor := 1.10;  -- +10%
    WHEN 2 THEN variation_factor := 1.80;  -- +80%
    WHEN 3 THEN variation_factor := 1.40;  -- +40%
    ELSE variation_factor := 1.0;
  END CASE;

  result := ROUND(base * variation_factor)::INT;
  
  RETURN GREATEST(result, 1); -- Mínimo 1
END;
$function$


CREATE OR REPLACE FUNCTION public.update_cms_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_featured_queue_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_cms_header_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$function$


CREATE OR REPLACE FUNCTION public.auto_expire_featured_ads()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si el aviso tiene featured_until y ya pasó, quitar destacado
  IF NEW.featured = true AND NEW.featured_until IS NOT NULL AND NEW.featured_until < NOW() THEN
    NEW.featured := false;
    NEW.featured_until := NULL;
    NEW.featured_order := NULL;
    RAISE NOTICE 'Auto-expired featured ad: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.is_admin_or_super()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN public.get_my_role() IN ('superadmin', 'admin', 'adminscrap');
END;
$function$


CREATE OR REPLACE FUNCTION public.create_template_from_subcategory(p_name text, p_description text, p_category_id uuid, p_subcategory_id uuid, p_created_by uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_template_id UUID;
BEGIN
  -- Crear template
  INSERT INTO attribute_templates (
    name, description, category_id, subcategory_id, created_by
  ) VALUES (
    p_name, p_description, p_category_id, p_subcategory_id, p_created_by
  )
  RETURNING id INTO v_template_id;
  
  -- Copiar todos los atributos de la subcategoría
  INSERT INTO attribute_template_fields (
    template_id, field_name, field_label, field_type, field_group,
    field_options, is_required, min_value, max_value, placeholder,
    help_text, prefix, suffix, sort_order
  )
  SELECT 
    v_template_id, field_name, field_label, field_type, field_group,
    field_options, is_required, min_value, max_value, placeholder,
    help_text, prefix, suffix, sort_order
  FROM dynamic_attributes
  WHERE subcategory_id = p_subcategory_id
    AND is_active = true
  ORDER BY sort_order;
  
  RETURN v_template_id;
END;
$function$


CREATE OR REPLACE FUNCTION public.apply_template_to_subcategory(p_template_id uuid, p_target_category_id uuid, p_target_subcategory_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_inserted_count INTEGER;
BEGIN
  -- Obtener el siguiente sort_order disponible
  WITH max_order AS (
    SELECT COALESCE(MAX(sort_order), 0) AS max_sort
    FROM dynamic_attributes
    WHERE subcategory_id = p_target_subcategory_id
  )
  -- Insertar atributos desde el template
  INSERT INTO dynamic_attributes (
    category_id, subcategory_id, type_id,
    field_name, field_label, field_type, field_group,
    field_options, is_required, min_value, max_value,
    placeholder, help_text, prefix, suffix, sort_order, is_active
  )
  SELECT 
    p_target_category_id,
    p_target_subcategory_id,
    NULL, -- type_id siempre null (SOFT HIDE)
    field_name, field_label, field_type, field_group,
    field_options, is_required, min_value, max_value,
    placeholder, help_text, prefix, suffix,
    (SELECT max_sort FROM max_order) + sort_order, -- Offset para no sobrescribir
    true
  FROM attribute_template_fields
  WHERE template_id = p_template_id
  ORDER BY sort_order;
  
  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$function$


CREATE OR REPLACE FUNCTION public.cleanup_expired_featured_ads()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE ads
  SET 
    featured = false,
    featured_until = NULL,
    featured_order = NULL
  WHERE 
    featured = true 
    AND featured_until IS NOT NULL 
    AND featured_until < NOW();
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % expired featured ads', affected_count;
  
  RETURN affected_count;
END;
$function$


CREATE OR REPLACE FUNCTION public.is_superadmin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('superadmin', 'admin')
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.auto_sitemap_for_premium()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Si el aviso es premium o destacado, agregarlo al sitemap automáticamente
  IF NEW.is_premium = TRUE OR NEW.featured = TRUE THEN
    NEW.in_sitemap := TRUE;
    NEW.sitemap_added_at := NOW();
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.calculate_execution_time()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.finished_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.execution_time_ms := EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.mark_message_as_read(message_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE contact_messages
  SET is_read = true, read_at = now()
  WHERE id = message_id AND ad_owner_id = auth.uid();
END;
$function$


CREATE OR REPLACE FUNCTION public.get_unread_messages_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM contact_messages
  WHERE ad_owner_id = auth.uid() AND is_read = false;
  
  RETURN unread_count;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_banners_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_random_intercalated_banner(p_category text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, title text, image_url text, link_url text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.image_url, b.link_url
  FROM banners b
  WHERE b.type = 'results_intercalated'
    AND b.is_active = true
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$function$


CREATE OR REPLACE FUNCTION public.auto_approve_premium_ads()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- MVP: Auto-aprobar todos los avisos (admin y user)
  NEW.approval_status := 'approved';
  NEW.approved_at := NOW();
  NEW.status := 'active';
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.unaccent(regdictionary, text)
 RETURNS text
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/unaccent', $function$unaccent_dict$function$


CREATE OR REPLACE FUNCTION public.unaccent(text)
 RETURNS text
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/unaccent', $function$unaccent_dict$function$


CREATE OR REPLACE FUNCTION public.unaccent_init(internal)
 RETURNS internal
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/unaccent', $function$unaccent_init$function$


CREATE OR REPLACE FUNCTION public.purchase_credits(p_user_id uuid, p_credits integer, p_payment_id uuid)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_new_balance INT;
  v_transaction_id UUID;
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  UPDATE public.user_credits
  SET balance = balance + p_credits
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  INSERT INTO public.credit_transactions (
    user_id, type, amount, balance_after, payment_id, description
  ) VALUES (
    p_user_id, 
    'purchase', 
    p_credits, 
    v_new_balance, 
    p_payment_id,
    'Compra de ' || p_credits || ' crédito(s)'
  ) RETURNING id INTO v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.update_users_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_sent_contacts_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  sent_count INTEGER;
BEGIN
  -- Si el usuario no está autenticado, retornar 0
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*)::INTEGER INTO sent_count
  FROM contact_messages
  WHERE sender_user_id = auth.uid();
  
  RETURN sent_count;
END;
$function$


CREATE OR REPLACE FUNCTION public.can_user_send_contact(user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  limits RECORD;
BEGIN
  SELECT * INTO limits FROM get_user_contact_limits(user_uuid);
  RETURN limits.can_send_more;
END;
$function$


CREATE OR REPLACE FUNCTION public.unaccent_lexize(internal, internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/unaccent', $function$unaccent_lexize$function$


CREATE OR REPLACE FUNCTION public.sync_ad_featured_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Cuando un slot se activa, marcar el ad como featured
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    UPDATE ads 
    SET featured = true, 
        featured_until = NEW.scheduled_end,
        featured_order = (
          SELECT COALESCE(MAX(featured_order), 0) + 1 
          FROM ads 
          WHERE category_id = NEW.category_id AND featured = true
        )
    WHERE id = NEW.ad_id;
  END IF;
  
  -- Cuando un slot termina/cancela, quitar featured del ad
  IF NEW.status IN ('completed', 'cancelled', 'expired') AND OLD.status = 'active' THEN
    UPDATE ads 
    SET featured = false, 
        featured_until = NULL,
        featured_order = NULL
    WHERE id = NEW.ad_id;
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.check_at_least_one_featured()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo aplicar para homepage_vip
  IF NEW.type = 'homepage_vip' THEN
    -- Si se está desactivando el último destacado de un device, bloquear
    IF OLD.is_featured = true AND NEW.is_featured = false THEN
      IF NOT EXISTS (
        SELECT 1 FROM banners 
        WHERE type = 'homepage_vip' 
          AND device_target = OLD.device_target 
          AND is_featured = true 
          AND is_active = true
          AND id != OLD.id
      ) THEN
        RAISE EXCEPTION 'Debe haber al menos 1 banner destacado activo para % en homepage_vip', OLD.device_target;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.activate_scheduled_featured_ads()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  activated_count INTEGER;
BEGIN
  UPDATE featured_ads_queue
  SET status = 'active'
  WHERE status = 'scheduled'
    AND scheduled_start <= CURRENT_DATE;
  
  GET DIAGNOSTICS activated_count = ROW_COUNT;
  
  RAISE NOTICE 'Activated % scheduled featured ads', activated_count;
  RETURN activated_count;
END;
$function$


CREATE OR REPLACE FUNCTION public.complete_expired_featured_ads()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  completed_count INTEGER;
BEGIN
  UPDATE featured_ads_queue
  SET status = 'completed'
  WHERE status = 'active'
    AND scheduled_end < CURRENT_DATE;
  
  GET DIAGNOSTICS completed_count = ROW_COUNT;
  
  RAISE NOTICE 'Completed % expired featured ads', completed_count;
  RETURN completed_count;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_images_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.assign_brand_to_subcategory(p_subcategory_id uuid, p_brand_id uuid, p_sort_order integer DEFAULT 0)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_id UUID;
BEGIN
  -- Verificar que la subcategoría existe
  IF NOT EXISTS (SELECT 1 FROM subcategories WHERE id = p_subcategory_id) THEN
    RAISE EXCEPTION 'Subcategoría no existe';
  END IF;
  
  -- Verificar que la marca existe
  IF NOT EXISTS (SELECT 1 FROM brands WHERE id = p_brand_id) THEN
    RAISE EXCEPTION 'Marca no existe';
  END IF;
  
  -- Insertar o actualizar
  INSERT INTO subcategory_brands (subcategory_id, brand_id, sort_order)
  VALUES (p_subcategory_id, p_brand_id, p_sort_order)
  ON CONFLICT (subcategory_id, brand_id) 
  DO UPDATE SET sort_order = p_sort_order
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$function$


CREATE OR REPLACE FUNCTION public.validate_contact_send_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  can_send BOOLEAN;
  limits RECORD;
BEGIN
  -- Solo validar si el sender_user_id está presente (usuarios autenticados)
  IF NEW.sender_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Obtener límites del usuario
  SELECT * INTO limits FROM get_user_contact_limits(NEW.sender_user_id);
  
  IF NOT limits.can_send_more THEN
    RAISE EXCEPTION 'LIMIT_REACHED: Has alcanzado el límite de contactos enviados (% de %)', 
      limits.current_sent, limits.max_sent;
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_dynamic_field(ad_data jsonb, field_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
  RETURN ad_data->>field_name;
END;
$function$


CREATE OR REPLACE FUNCTION public.auto_deactivate_expired_banners()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE banners 
  SET is_active = false
  WHERE is_active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$function$


CREATE OR REPLACE FUNCTION public.featured_ads_daily_maintenance()
 RETURNS TABLE(activated integer, completed integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  activated := activate_scheduled_featured_ads();
  completed := complete_expired_featured_ads();
  RETURN NEXT;
END;
$function$


CREATE OR REPLACE FUNCTION public.sync_ad_category_names()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Sincronizar nombre de categoría si category_id está presente
  IF NEW.category_id IS NOT NULL THEN
    SELECT display_name INTO NEW.category
    FROM categories 
    WHERE id = NEW.category_id;
  END IF;
  
  -- Sincronizar nombre de subcategoría si subcategory_id está presente
  IF NEW.subcategory_id IS NOT NULL THEN
    SELECT display_name INTO NEW.subcategory
    FROM subcategories 
    WHERE id = NEW.subcategory_id;
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_profile_contacts_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE users 
  SET profile_contacts_received = (
    SELECT COUNT(*) FROM profile_contacts WHERE profile_user_id = NEW.profile_user_id
  )
  WHERE id = NEW.profile_user_id;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.increment_profile_view(p_profile_user_id uuid, p_visitor_user_id uuid DEFAULT NULL::uuid, p_visitor_ip character varying DEFAULT NULL::character varying, p_source_type character varying DEFAULT 'direct'::character varying, p_source_ad_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  last_view_time TIMESTAMPTZ;
BEGIN
  -- Verificar si hay una vista reciente (últimos 30 min) del mismo visitante
  SELECT MAX(created_at) INTO last_view_time
  FROM profile_views
  WHERE profile_user_id = p_profile_user_id
    AND (
      (p_visitor_user_id IS NOT NULL AND visitor_user_id = p_visitor_user_id)
      OR (p_visitor_ip IS NOT NULL AND visitor_ip = p_visitor_ip)
    )
    AND created_at > NOW() - INTERVAL '30 minutes';

  -- Si no hay vista reciente, registrar nueva
  IF last_view_time IS NULL THEN
    INSERT INTO profile_views (
      profile_user_id, visitor_user_id, visitor_ip, source_type, source_ad_id
    ) VALUES (
      p_profile_user_id, p_visitor_user_id, p_visitor_ip, p_source_type, p_source_ad_id
    );
    
    -- Actualizar contador en users
    UPDATE users SET profile_views = profile_views + 1 WHERE id = p_profile_user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_ads_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.check_recipient_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  recipient_limits RECORD;
BEGIN
  -- Obtener límites del destinatario (vendedor)
  SELECT * INTO recipient_limits
  FROM get_user_contact_limits(NEW.ad_owner_id);
  
  -- Si el vendedor alcanzó su límite de recibidos
  IF NOT recipient_limits.can_receive_more THEN
    -- Crear el contacto pero marcarlo como bloqueado
    NEW.status := 'blocked';
    NEW.is_blocked := true;
    NEW.blocked_reason := 'recipient_limit_reached';
    
    -- Crear notificación para el vendedor
    INSERT INTO contact_notifications (
      user_id, 
      contact_message_id, 
      type, 
      title, 
      message
    ) VALUES (
      NEW.ad_owner_id,
      NEW.id,
      'limit_reached',
      'Nueva consulta bloqueada - Límite alcanzado',
      format('Recibiste una nueva consulta pero alcanzaste tu límite de %s contactos. Actualiza a Premium para desbloquearla.', 
        recipient_limits.max_received)
    );
  ELSE
    -- Crear notificación normal de nuevo contacto
    INSERT INTO contact_notifications (
      user_id, 
      contact_message_id, 
      type, 
      title, 
      message
    ) VALUES (
      NEW.ad_owner_id,
      NEW.id,
      'new_contact',
      'Nueva consulta recibida',
      format('Tienes una nueva consulta sobre tu aviso. Contactos: %s de %s', 
        recipient_limits.current_received + 1,
        COALESCE(recipient_limits.max_received::TEXT, '∞'))
    );
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_banners_clean_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.generate_payment_receipt_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status = 'completed' AND NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'R24-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('payment_receipt_seq')::TEXT, 6, '0');
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.can_send_contact()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role TEXT;
  sent_count INTEGER;
BEGIN
  -- Anónimos siempre pueden
  IF auth.uid() IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Obtener rol
  SELECT role INTO user_role FROM users WHERE id = auth.uid();
  
  -- Premium/empresa/superadmin/verificado: sin límite
  IF user_role NOT IN ('free', 'free-verificado') THEN
    RETURN TRUE;
  END IF;
  
  -- FREE: verificar límite (bypass RLS con SECURITY DEFINER)
  SELECT COUNT(*) INTO sent_count 
  FROM contact_messages 
  WHERE sender_user_id = auth.uid();
  
  RETURN sent_count < 5;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_form_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_payments_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.increment_banner_impression(banner_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE banners_clean 
  SET impressions = COALESCE(impressions, 0) + 1
  WHERE id = banner_id;
END;
$function$


CREATE OR REPLACE FUNCTION public.increment_banner_click(banner_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE banners_clean
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = banner_id;
END;
$function$


CREATE OR REPLACE FUNCTION public.activate_subscription_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  plan_id UUID;
  period_months INTEGER;
BEGIN
  IF NEW.status = 'completed' AND NEW.payment_type IN ('subscription', 'upgrade', 'renewal') THEN
    -- Obtener plan_id del metadata
    plan_id := (NEW.metadata->>'plan_id')::UUID;
    period_months := COALESCE((NEW.metadata->>'period_months')::INTEGER, 1);
    
    IF plan_id IS NOT NULL THEN
      UPDATE users SET
        subscription_plan_id = plan_id,
        subscription_status = 'active',
        subscription_started_at = NOW(),
        subscription_expires_at = NOW() + (period_months || ' months')::INTERVAL
      WHERE id = NEW.user_id;
      
      RAISE NOTICE 'Activated subscription for user % with plan %', NEW.user_id, plan_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_form_template(p_category_id uuid, p_subcategory_id uuid DEFAULT NULL::uuid, p_operation_type_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(template_id uuid, template_name character varying, template_display_name character varying, fields jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH selected_template AS (
    SELECT 
      ft.id,
      ft.name,
      ft.display_name,
      ft.priority
    FROM form_templates ft
    WHERE ft.is_active = true
      AND (
        (ft.category_id = p_category_id 
         AND ft.subcategory_id = p_subcategory_id 
         AND ft.operation_type_id = p_operation_type_id
         AND p_subcategory_id IS NOT NULL 
         AND p_operation_type_id IS NOT NULL)
        OR
        (ft.category_id = p_category_id 
         AND ft.subcategory_id = p_subcategory_id 
         AND ft.operation_type_id IS NULL
         AND p_subcategory_id IS NOT NULL)
        OR
        (ft.category_id = p_category_id 
         AND ft.subcategory_id IS NULL 
         AND ft.operation_type_id IS NULL)
        OR
        ft.is_default = true
      )
    ORDER BY ft.priority DESC, ft.created_at DESC
    LIMIT 1
  )
  SELECT 
    st.id,
    st.name,
    st.display_name,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ff.id,
          'fieldName', ff.field_name,
          'fieldLabel', ff.field_label,
          'fieldType', ff.field_type,
          'placeholder', ff.placeholder,
          'helpText', ff.help_text,
          'sectionName', ff.section_name,
          'isRequired', ff.is_required,
          'minValue', ff.min_value,
          'maxValue', ff.max_value,
          'minLength', ff.min_length,
          'maxLength', ff.max_length,
          'pattern', ff.pattern,
          'options', ff.options,
          'dependsOn', ff.depends_on,
          'showWhen', ff.show_when,
          'displayOrder', ff.display_order,
          'fieldWidth', ff.field_width
        )
        ORDER BY ff.display_order, ff.field_name
      )
      FROM form_fields ff
      WHERE ff.form_template_id = st.id
        AND ff.is_active = true
    ) as fields
  FROM selected_template st;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_featured_ads_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.expire_featured_ads()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_expired INT;
BEGIN
  UPDATE public.featured_ads
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= NOW();
  
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  RETURN v_expired;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_user_contact_limits(user_uuid uuid)
 RETURNS TABLE(max_received integer, max_sent integer, current_received bigint, current_sent bigint, can_receive_more boolean, can_send_more boolean, plan_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  plan_record RECORD;
  custom_limit INTEGER;
BEGIN
  -- Obtener plan del usuario y límites custom
  SELECT 
    sp.id,
    sp.name,
    sp.max_contacts_received,
    sp.max_contacts_sent,
    COALESCE(u.custom_max_contacts, NULL::INTEGER) as custom_max_contacts
  INTO plan_record
  FROM users u
  LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
  WHERE u.id = user_uuid;
  
  -- Si el usuario no existe o no tiene plan asignado, usar plan FREE por defecto
  IF plan_record.id IS NULL OR plan_record.name IS NULL THEN
    SELECT 
      id,
      name,
      max_contacts_received,
      max_contacts_sent,
      NULL::INTEGER as custom_max_contacts
    INTO plan_record
    FROM subscription_plans
    WHERE name = 'free'
    LIMIT 1;
  END IF;
  
  -- Contar contactos recibidos activos
  SELECT COUNT(*) INTO current_received
  FROM contact_messages
  WHERE ad_owner_id = user_uuid
    AND status = 'active';
  
  -- Contar contactos enviados activos
  SELECT COUNT(*) INTO current_sent
  FROM contact_messages
  WHERE sender_user_id = user_uuid
    AND status = 'active';
  
  -- Aplicar límite custom si existe
  custom_limit := COALESCE(plan_record.custom_max_contacts, plan_record.max_contacts_sent);
  
  RETURN QUERY SELECT
    plan_record.max_contacts_received,
    COALESCE(custom_limit, 999999) AS max_sent,
    current_received,
    current_sent,
    (plan_record.max_contacts_received IS NULL OR current_received < plan_record.max_contacts_received) AS can_receive,
    (custom_limit IS NULL OR current_sent < custom_limit) AS can_send,
    COALESCE(plan_record.name, 'FREE')::TEXT;
END;
$function$


CREATE OR REPLACE FUNCTION public.check_featured_availability(p_placement character varying, p_category_id uuid, p_start_date date, p_duration_days integer DEFAULT 15)
 RETURNS TABLE(is_available boolean, slots_total integer, slots_used integer, slots_available integer, next_available_date date)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_max_slots INT;
  v_end_date DATE;
  v_used_slots INT;
  v_next_date DATE;
BEGIN
  SELECT (value #>> '{}')::INT INTO v_max_slots
  FROM global_settings 
  WHERE key = 'featured_slots_' || p_placement;
  
  IF v_max_slots IS NULL THEN
    v_max_slots := 10;
  END IF;
  
  v_end_date := p_start_date + p_duration_days;
  
  SELECT COUNT(DISTINCT user_id) INTO v_used_slots
  FROM featured_ads
  WHERE placement = p_placement
    AND category_id = p_category_id
    AND status IN ('active', 'pending')
    AND (
      (scheduled_start <= p_start_date AND COALESCE(expires_at::date, scheduled_start + duration_days) > p_start_date)
      OR (scheduled_start >= p_start_date AND scheduled_start < v_end_date)
    );
  
  IF v_used_slots >= v_max_slots THEN
    SELECT MIN(COALESCE(expires_at::date, scheduled_start + duration_days)) INTO v_next_date
    FROM featured_ads
    WHERE placement = p_placement
      AND category_id = p_category_id
      AND status IN ('active', 'pending')
      AND COALESCE(expires_at::date, scheduled_start + duration_days) > CURRENT_DATE;
  END IF;
  
  RETURN QUERY SELECT 
    (v_used_slots < v_max_slots),
    v_max_slots,
    v_used_slots,
    (v_max_slots - v_used_slots),
    COALESCE(v_next_date, p_start_date);
END;
$function$


CREATE OR REPLACE FUNCTION public.reset_monthly_contacts()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE users
  SET contacts_used_this_month = 0,
      contacts_reset_at = NOW()
  WHERE contacts_reset_at IS NULL 
     OR contacts_reset_at < DATE_TRUNC('month', NOW());
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE 'Reset contacts for % users', reset_count;
  RETURN reset_count;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_featured_by_category(p_category_id uuid, p_subcategory_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(ad_id uuid, title character varying, description text, price numeric, image_url text, location character varying, user_name character varying, expires_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id, a.title, a.description, a.price,
    a.image_url, a.location, u.full_name, fa.expires_at
  FROM featured_ads fa
  JOIN ads a ON fa.ad_id = a.id
  JOIN users u ON a.user_id = u.id
  WHERE fa.category_id = p_category_id
    AND (p_subcategory_id IS NULL OR fa.subcategory_id = p_subcategory_id)
    AND fa.status = 'active'
    AND fa.expires_at > NOW()
  ORDER BY fa.activated_at DESC;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.generate_short_id()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$function$


CREATE OR REPLACE FUNCTION public.generate_ad_slug(title text, short_id text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  base_slug TEXT;
BEGIN
  -- Normalizar título: quitar acentos, espacios -> guiones, solo alfanuméricos
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(title, '[áàäâã]', 'a', 'gi'),
                '[éèëê]', 'e', 'gi'),
              '[íìïî]', 'i', 'gi'),
            '[óòöôõ]', 'o', 'gi'),
          '[úùüû]', 'u', 'gi'),
        '[ñ]', 'n', 'gi'),
      '[^a-z0-9]+', '-', 'gi')
  );
  
  -- Quitar guiones al inicio y final, limitar a 100 chars
  base_slug := left(trim(both '-' from base_slug), 100);
  
  -- Retornar slug con short_id al final
  RETURN base_slug || '-' || short_id;
END;
$function$


CREATE OR REPLACE FUNCTION public.trigger_generate_ad_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Asegurar que short_id esté presente
  IF NEW.short_id IS NULL OR NEW.short_id = '' THEN
    NEW.short_id := generate_short_id();
  END IF;
  
  -- Generar slug si no existe o si cambió el título
  IF NEW.slug IS NULL OR NEW.slug = '' OR 
     (TG_OP = 'UPDATE' AND OLD.title IS DISTINCT FROM NEW.title) THEN
    NEW.slug := generate_ad_slug(NEW.title::TEXT, NEW.short_id::TEXT);
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.create_featured_ad(p_ad_id uuid, p_user_id uuid, p_placement character varying, p_scheduled_start date)
 RETURNS TABLE(success boolean, featured_id uuid, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_category_id UUID;
  v_ad_user_id UUID;
  v_credits_available INT;
  v_is_available BOOLEAN;
  v_duration INT;
  v_new_id UUID;
BEGIN
  -- 1. Verificar que el aviso existe y pertenece al usuario
  SELECT category_id, user_id INTO v_category_id, v_ad_user_id
  FROM ads WHERE id = p_ad_id;
  
  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Aviso no encontrado';
    RETURN;
  END IF;
  
  IF v_ad_user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No sos el dueño de este aviso';
    RETURN;
  END IF;
  
  -- 2. Verificar créditos disponibles
  SELECT (credits_total - credits_used) INTO v_credits_available
  FROM user_featured_credits WHERE user_id = p_user_id;
  
  IF COALESCE(v_credits_available, 0) <= 0 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No tenés créditos disponibles';
    RETURN;
  END IF;
  
  -- 3. NUEVA LÓGICA: Verificar que este AVISO no esté ya destacado en este placement
  -- (Ya no verificamos por usuario, sino por aviso específico)
  IF EXISTS (
    SELECT 1 FROM featured_ads 
    WHERE ad_id = p_ad_id 
      AND placement = p_placement 
      AND status IN ('pending', 'active')
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Este aviso ya está destacado en esta ubicación. Esperá a que expire para volver a destacarlo.';
    RETURN;
  END IF;
  
  -- 4. Obtener duración de settings
  SELECT (value #>> '{}')::INT INTO v_duration
  FROM global_settings WHERE key = 'featured_duration_days';
  v_duration := COALESCE(v_duration, 15);
  
  -- 5. Verificar disponibilidad de slots en la categoría
  SELECT fa.is_available INTO v_is_available
  FROM check_featured_availability(p_placement, v_category_id, p_scheduled_start, v_duration) fa;
  
  IF NOT v_is_available THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'No hay slots disponibles en esa fecha. Probá con otra fecha.';
    RETURN;
  END IF;
  
  -- 6. Calcular prioridad FIFO
  -- (Orden basado en created_at para cola justa)
  
  -- 7. Crear el registro de destacado
  INSERT INTO featured_ads (
    ad_id, user_id, placement, category_id,
    scheduled_start, duration_days, status, priority
  ) VALUES (
    p_ad_id, p_user_id, p_placement, v_category_id,
    p_scheduled_start, v_duration, 'pending', 
    (SELECT COALESCE(MAX(priority), 0) + 1 FROM featured_ads WHERE placement = p_placement AND category_id = v_category_id)
  )
  RETURNING id INTO v_new_id;
  
  -- 8. Consumir crédito
  UPDATE user_featured_credits
  SET credits_used = credits_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- 9. Marcar que el crédito fue consumido
  UPDATE featured_ads
  SET credit_consumed = TRUE
  WHERE id = v_new_id;
  
  RETURN QUERY SELECT TRUE, v_new_id, 'Aviso programado para destacar'::TEXT;
END;
$function$


CREATE OR REPLACE FUNCTION public.check_promo_status(p_user_id uuid)
 RETURNS TABLE(promo_active boolean, can_claim boolean, already_claimed boolean, credits_available integer, promo_message text, promo_end_date date)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_promo_enabled BOOLEAN;
  v_promo_end DATE;
  v_promo_start DATE;
  v_claimed BOOLEAN;
  v_credits INT;
  v_message TEXT;
BEGIN
  SELECT (value #>> '{}')::BOOLEAN INTO v_promo_enabled
  FROM global_settings WHERE key = 'featured_promo_enabled';
  
  SELECT (value #>> '{}')::DATE INTO v_promo_start
  FROM global_settings WHERE key = 'featured_promo_start';
  
  SELECT (value #>> '{}')::DATE INTO v_promo_end
  FROM global_settings WHERE key = 'featured_promo_end';
  
  SELECT (value #>> '{}')::INT INTO v_credits
  FROM global_settings WHERE key = 'featured_promo_credits';
  
  SELECT value #>> '{}' INTO v_message
  FROM global_settings WHERE key = 'featured_promo_message';
  
  SELECT EXISTS(
    SELECT 1 FROM user_promo_claims 
    WHERE user_id = p_user_id AND promo_code = 'launch_2026'
  ) INTO v_claimed;
  
  RETURN QUERY SELECT 
    COALESCE(v_promo_enabled, false) 
      AND CURRENT_DATE >= COALESCE(v_promo_start, CURRENT_DATE)
      AND CURRENT_DATE <= COALESCE(v_promo_end, '2099-12-31'::DATE),
    COALESCE(v_promo_enabled, false) 
      AND NOT COALESCE(v_claimed, false) 
      AND CURRENT_DATE >= COALESCE(v_promo_start, CURRENT_DATE)
      AND CURRENT_DATE <= COALESCE(v_promo_end, '2099-12-31'::DATE),
    COALESCE(v_claimed, false),
    COALESCE(v_credits, 3),
    COALESCE(v_message, '🎉 Créditos gratis de lanzamiento disponibles'),
    v_promo_end;
END;
$function$


CREATE OR REPLACE FUNCTION public.create_coupon(p_admin_id uuid, p_code character varying, p_name character varying, p_title character varying, p_description text, p_credits_amount integer, p_membership_id uuid, p_max_redemptions integer, p_expires_at timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_coupon_id UUID;
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  -- Verificar código único
  IF EXISTS (SELECT 1 FROM coupons WHERE UPPER(code) = UPPER(p_code)) THEN
    RETURN json_build_object('success', false, 'error', 'El código ya existe');
  END IF;
  
  -- Crear cupón
  INSERT INTO coupons (
    code, name, title, description, credits_amount, 
    membership_id, max_redemptions, expires_at, created_by
  ) VALUES (
    UPPER(p_code), p_name, p_title, p_description, p_credits_amount,
    p_membership_id, p_max_redemptions, p_expires_at, p_admin_id
  ) RETURNING id INTO v_coupon_id;
  
  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon_id,
    'message', 'Cupón creado exitosamente'
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.activate_pending_featured_ads()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_activated INT := 0;
  v_expired INT := 0;
BEGIN
  -- 1. Activar los que su fecha de inicio llegó
  UPDATE featured_ads
  SET 
    status = 'active',
    actual_start = NOW()
  WHERE status = 'pending'
    AND scheduled_start <= CURRENT_DATE;
  
  GET DIAGNOSTICS v_activated = ROW_COUNT;
  
  -- 2. EXPIRAR los que ya pasaron su fecha (CRÍTICO: esto faltaba ejecutarse automáticamente)
  UPDATE featured_ads
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  
  -- Log para debugging
  IF v_activated > 0 OR v_expired > 0 THEN
    RAISE NOTICE 'Featured ads: % activados, % expirados', v_activated, v_expired;
  END IF;
  
  RETURN v_activated;
END;
$function$


CREATE OR REPLACE FUNCTION public.featured_ads_audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Solo registrar cambios de estado relevantes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO featured_ads_audit (featured_ad_id, action, performed_by, metadata)
    VALUES (NEW.id, 'created', NEW.user_id, jsonb_build_object('status', NEW.status));
  
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO featured_ads_audit (featured_ad_id, action, performed_by, reason, metadata)
      VALUES (
        NEW.id, 
        CASE 
          WHEN NEW.status = 'cancelled' THEN 'cancelled'
          WHEN NEW.status = 'active' AND OLD.status = 'pending' THEN 'activated'
          WHEN NEW.status = 'expired' THEN 'expired'
          ELSE 'edited'
        END,
        COALESCE(NEW.cancelled_by, NEW.user_id),
        NEW.cancelled_reason,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'refunded', NEW.refunded
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_coupon(p_admin_id uuid, p_coupon_id uuid, p_name character varying, p_title character varying, p_description text, p_credits_amount integer, p_membership_id uuid, p_max_redemptions integer, p_expires_at timestamp with time zone, p_is_active boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  -- Actualizar cupón
  UPDATE coupons SET
    name = COALESCE(p_name, name),
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    credits_amount = COALESCE(p_credits_amount, credits_amount),
    membership_id = p_membership_id,
    max_redemptions = COALESCE(p_max_redemptions, max_redemptions),
    expires_at = COALESCE(p_expires_at, expires_at),
    is_active = COALESCE(p_is_active, is_active)
  WHERE id = p_coupon_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón no encontrado');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Cupón actualizado');
END;
$function$


CREATE OR REPLACE FUNCTION public.update_hero_images_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.delete_coupon(p_admin_id uuid, p_coupon_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  -- Eliminar cupón
  DELETE FROM coupons WHERE id = p_coupon_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón no encontrado');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Cupón eliminado');
END;
$function$


CREATE OR REPLACE FUNCTION public.create_coupon_invitation(p_admin_id uuid, p_coupon_id uuid, p_email character varying)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_token VARCHAR;
  v_invitation_id UUID;
  v_coupon RECORD;
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  -- Verificar cupón
  SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón no encontrado o inactivo');
  END IF;
  
  -- Generar token único
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Crear invitación
  INSERT INTO coupon_invitations (
    coupon_id, email, invited_by, token
  ) VALUES (
    p_coupon_id, LOWER(p_email), p_admin_id, v_token
  ) RETURNING id INTO v_invitation_id;
  
  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_token,
    'email', p_email,
    'coupon_code', v_coupon.code,
    'message', 'Invitación creada. Enviar email manualmente o integrar con servicio de email.'
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.validate_invitation_token(p_token character varying)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_invitation RECORD;
  v_coupon RECORD;
BEGIN
  SELECT ci.*, c.code, c.title, c.description, c.credits_amount, c.membership_id
  INTO v_invitation
  FROM coupon_invitations ci
  JOIN coupons c ON c.id = ci.coupon_id
  WHERE ci.token = p_token
    AND ci.status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invitación no válida o ya usada');
  END IF;
  
  -- Verificar que el cupón sigue activo
  SELECT * INTO v_coupon FROM coupons 
  WHERE id = v_invitation.coupon_id 
    AND is_active = true 
    AND expires_at > NOW()
    AND current_redemptions < max_redemptions;
  
  IF NOT FOUND THEN
    -- Marcar invitación como expirada
    UPDATE coupon_invitations SET status = 'expired' WHERE token = p_token;
    RETURN json_build_object('valid', false, 'error', 'El cupón asociado ha expirado');
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'email', v_invitation.email,
    'coupon', json_build_object(
      'code', v_invitation.code,
      'title', v_invitation.title,
      'description', v_invitation.description,
      'credits_amount', v_invitation.credits_amount
    )
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_coupon_invitations(p_admin_id uuid, p_coupon_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Verificar que es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'invitations', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', ci.id,
          'email', ci.email,
          'token', ci.token,
          'status', ci.status,
          'sent_at', ci.sent_at,
          'used_at', ci.used_at,
          'used_by_email', u.email
        ) ORDER BY ci.sent_at DESC
      ), '[]'::json)
      FROM coupon_invitations ci
      LEFT JOIN users u ON u.id = ci.used_by
      WHERE ci.coupon_id = p_coupon_id
    )
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.claim_promo_credits(p_user_id uuid)
 RETURNS TABLE(success boolean, credits_granted integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_promo_enabled BOOLEAN;
  v_promo_credits INT;
  v_promo_start DATE;
  v_promo_end DATE;
  v_already_claimed BOOLEAN;
BEGIN
  SELECT (value #>> '{}')::BOOLEAN INTO v_promo_enabled
  FROM global_settings WHERE key = 'featured_promo_enabled';
  
  IF NOT COALESCE(v_promo_enabled, false) THEN
    RETURN QUERY SELECT FALSE, 0, 'La promoción no está activa'::TEXT;
    RETURN;
  END IF;
  
  SELECT (value #>> '{}')::DATE INTO v_promo_start
  FROM global_settings WHERE key = 'featured_promo_start';
  
  SELECT (value #>> '{}')::DATE INTO v_promo_end
  FROM global_settings WHERE key = 'featured_promo_end';
  
  IF CURRENT_DATE < COALESCE(v_promo_start, CURRENT_DATE) THEN
    RETURN QUERY SELECT FALSE, 0, 'La promoción aún no comenzó'::TEXT;
    RETURN;
  END IF;
  
  IF CURRENT_DATE > COALESCE(v_promo_end, '2099-12-31'::DATE) THEN
    RETURN QUERY SELECT FALSE, 0, 'La promoción ya finalizó'::TEXT;
    RETURN;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM user_promo_claims 
    WHERE user_id = p_user_id AND promo_code = 'launch_2026'
  ) INTO v_already_claimed;
  
  IF v_already_claimed THEN
    RETURN QUERY SELECT FALSE, 0, 'Ya reclamaste los créditos de esta promoción'::TEXT;
    RETURN;
  END IF;
  
  SELECT (value #>> '{}')::INT INTO v_promo_credits
  FROM global_settings WHERE key = 'featured_promo_credits';
  v_promo_credits := COALESCE(v_promo_credits, 3);
  
  INSERT INTO user_featured_credits (user_id, credits_total, credits_used)
  VALUES (p_user_id, v_promo_credits, 0)
  ON CONFLICT (user_id) DO UPDATE 
  SET credits_total = user_featured_credits.credits_total + v_promo_credits;
  
  INSERT INTO user_promo_claims (user_id, promo_code, credits_granted)
  VALUES (p_user_id, 'launch_2026', v_promo_credits);
  
  RETURN QUERY SELECT TRUE, v_promo_credits, 
    ('¡Felicitaciones! Recibiste ' || v_promo_credits || ' créditos gratis')::TEXT;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_plan_names(plan_ids uuid[])
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN ARRAY(
    SELECT name FROM membership_plans 
    WHERE id = ANY(plan_ids)
    ORDER BY price
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_admin_coupons(p_admin_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'coupons', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', c.id,
          'code', c.code,
          'name', c.name,
          'title', c.title,
          'description', c.description,
          'gives_credits', COALESCE(c.gives_credits, c.credits_amount > 0),
          'credits_amount', c.credits_amount,
          'gives_membership', COALESCE(c.gives_membership, c.membership_id IS NOT NULL),
          'membership_all', COALESCE(c.membership_all, false),
          'membership_plan_ids', COALESCE(c.membership_plan_ids, '{}'),
          'membership_plan_names', get_plan_names(COALESCE(c.membership_plan_ids, '{}')),
          'max_redemptions', c.max_redemptions,
          'current_redemptions', c.current_redemptions,
          'expires_at', c.expires_at,
          'is_active', c.is_active,
          'created_at', c.created_at
        ) ORDER BY c.created_at DESC
      ), '[]'::json)
      FROM coupons c
    )
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_featured_by_category(p_category_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, ad_id uuid, expires_at timestamp with time zone, ad_title character varying, ad_price numeric, ad_images json)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    fa.id,
    fa.ad_id,
    fa.expires_at,
    a.title,
    a.price,
    a.images
  FROM public.featured_ads fa
  JOIN public.ads a ON a.id = fa.ad_id
  WHERE fa.category_id = p_category_id
    AND fa.status = 'active'
    AND fa.expires_at > NOW()
  ORDER BY fa.activated_at DESC
  LIMIT p_limit;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_user_featured_ads(p_user_id uuid)
 RETURNS TABLE(id uuid, ad_id uuid, status character varying, activated_at timestamp with time zone, expires_at timestamp with time zone, credits_spent integer, ad_title character varying)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    fa.id,
    fa.ad_id,
    fa.status,
    fa.activated_at,
    fa.expires_at,
    fa.credits_spent,
    a.title
  FROM public.featured_ads fa
  JOIN public.ads a ON a.id = fa.ad_id
  WHERE fa.user_id = p_user_id
  ORDER BY fa.created_at DESC;
END;
$function$


CREATE OR REPLACE FUNCTION public.is_admin_role()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT role INTO user_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Solo SuperAdmin y Admin (Revendedores) tienen acceso administrativo
  RETURN user_role IN ('superadmin', 'admin');
END;
$function$


CREATE OR REPLACE FUNCTION public.get_credit_transactions(p_user_id uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, type character varying, amount integer, balance_after integer, description text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.type,
    ct.amount,
    ct.balance_after,
    ct.description,
    ct.created_at
  FROM public.credit_transactions ct
  WHERE ct.user_id = p_user_id
  ORDER BY ct.created_at DESC
  LIMIT p_limit;
END;
$function$


CREATE OR REPLACE FUNCTION public.create_coupon_v2(p_admin_id uuid, p_code character varying, p_name character varying, p_title character varying, p_description text, p_gives_credits boolean, p_credits_amount integer, p_gives_membership boolean, p_membership_all boolean, p_membership_plan_ids uuid[], p_max_redemptions integer, p_expires_at timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_coupon_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  IF EXISTS (SELECT 1 FROM coupons WHERE UPPER(code) = UPPER(p_code)) THEN
    RETURN json_build_object('success', false, 'error', 'El código ya existe');
  END IF;
  
  IF NOT p_gives_credits AND NOT p_gives_membership THEN
    RETURN json_build_object('success', false, 'error', 'El cupón debe regalar créditos o membresía');
  END IF;
  
  INSERT INTO coupons (
    code, name, title, description, 
    gives_credits, credits_amount, 
    gives_membership, membership_all, membership_plan_ids,
    max_redemptions, expires_at, created_by
  ) VALUES (
    UPPER(p_code), p_name, p_title, p_description,
    p_gives_credits, CASE WHEN p_gives_credits THEN p_credits_amount ELSE 0 END,
    p_gives_membership, 
    CASE WHEN p_gives_membership THEN p_membership_all ELSE false END,
    CASE WHEN p_gives_membership AND NOT p_membership_all THEN p_membership_plan_ids ELSE '{}' END,
    p_max_redemptions, p_expires_at, p_admin_id
  ) RETURNING id INTO v_coupon_id;
  
  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon_id,
    'message', 'Cupón creado exitosamente'
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_featured_month_availability(p_placement character varying, p_category_id uuid, p_year integer, p_month integer)
 RETURNS TABLE(day integer, is_available boolean, slots_total integer, slots_used integer, slots_available integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_max_slots INT;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  SELECT (value #>> '{}')::INT INTO v_max_slots
  FROM global_settings
  WHERE key = 'featured_slots_' || p_placement;

  IF v_max_slots IS NULL THEN
    v_max_slots := 10;
  END IF;

  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::DATE;

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(v_start_date, v_end_date, INTERVAL '1 day')::DATE AS day_date
  )
  SELECT
    EXTRACT(DAY FROM d.day_date)::INT AS day,
    (COUNT(DISTINCT fa.user_id) < v_max_slots) AS is_available,
    v_max_slots AS slots_total,
    COUNT(DISTINCT fa.user_id) AS slots_used,
    (v_max_slots - COUNT(DISTINCT fa.user_id)) AS slots_available
  FROM days d
  LEFT JOIN featured_ads fa
    ON fa.placement = p_placement
    AND fa.category_id = p_category_id
    AND fa.status IN ('active', 'pending')
    AND (
      fa.scheduled_start <= d.day_date
      AND COALESCE(fa.expires_at::DATE, fa.scheduled_start + fa.duration_days) > d.day_date
    )
  GROUP BY d.day_date
  ORDER BY d.day_date;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_user_credits_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_lateral_banners(p_category text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, title text, image_url text, link_url text, "position" text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.image_url, b.link_url, b."position"
  FROM banners b
  WHERE b.type = 'results_lateral'
    AND b.is_active = true
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
  ORDER BY b."position", b.display_order
  LIMIT 4;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_homepage_banners(p_type text, p_category text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, title text, image_url text, link_url text, category text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.image_url, b.link_url, b.category
  FROM banners b
  WHERE b.type = p_type
    AND b.is_active = true
    AND (p_category IS NULL OR b.category = p_category OR b.category IS NULL)
  ORDER BY b.display_order, b.created_at DESC
  LIMIT 6;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_coupon_v2(p_admin_id uuid, p_coupon_id uuid, p_name character varying, p_title character varying, p_description text, p_gives_credits boolean, p_credits_amount integer, p_gives_membership boolean, p_membership_all boolean, p_membership_plan_ids uuid[], p_max_redemptions integer, p_expires_at timestamp with time zone, p_is_active boolean)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = p_admin_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No autorizado');
  END IF;
  
  UPDATE coupons SET
    name = COALESCE(p_name, name),
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    gives_credits = COALESCE(p_gives_credits, gives_credits),
    credits_amount = COALESCE(p_credits_amount, credits_amount),
    gives_membership = COALESCE(p_gives_membership, gives_membership),
    membership_all = COALESCE(p_membership_all, membership_all),
    membership_plan_ids = COALESCE(p_membership_plan_ids, membership_plan_ids),
    max_redemptions = COALESCE(p_max_redemptions, max_redemptions),
    expires_at = COALESCE(p_expires_at, expires_at),
    is_active = COALESCE(p_is_active, is_active)
  WHERE id = p_coupon_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón no encontrado');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Cupón actualizado');
END;
$function$


CREATE OR REPLACE FUNCTION public.validate_coupon(p_code character varying)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_coupon RECORD;
BEGIN
  SELECT c.*, get_plan_names(c.membership_plan_ids) as plan_names
  INTO v_coupon
  FROM coupons c
  WHERE UPPER(c.code) = UPPER(p_code) AND c.is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Cupón no encontrado');
  END IF;
  
  IF v_coupon.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'Este cupón ha expirado');
  END IF;
  
  IF v_coupon.current_redemptions >= v_coupon.max_redemptions THEN
    RETURN json_build_object('valid', false, 'error', 'Este cupón ya no está disponible');
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'coupon', json_build_object(
      'id', v_coupon.id,
      'code', v_coupon.code,
      'title', v_coupon.title,
      'description', v_coupon.description,
      'gives_credits', COALESCE(v_coupon.gives_credits, true),
      'credits_amount', v_coupon.credits_amount,
      'gives_membership', COALESCE(v_coupon.gives_membership, false),
      'membership_all', COALESCE(v_coupon.membership_all, false),
      'membership_plan_ids', COALESCE(v_coupon.membership_plan_ids, '{}'),
      'membership_plan_names', COALESCE(v_coupon.plan_names, '{}'),
      'expires_at', v_coupon.expires_at,
      'remaining', v_coupon.max_redemptions - v_coupon.current_redemptions
    )
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_models_by_brand(brand_slug text)
 RETURNS TABLE(id uuid, name text, display_name text, year_from integer, year_to integer, short_description text, main_image_url text, price_range jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.display_name,
    m.year_from,
    m.year_to,
    m.short_description,
    m.main_image_url,
    m.price_range
  FROM models m
  JOIN brands b ON m.brand_id = b.id
  WHERE b.slug = brand_slug
    AND m.is_active = true
  ORDER BY m.display_name;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_ads_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.province, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.city, '')), 'C');
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.search_models(search_term text)
 RETURNS TABLE(id uuid, brand_name text, model_name text, full_name text, category text, subcategory text, confidence numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    b.display_name AS brand_name,
    m.display_name AS model_name,
    CONCAT(b.display_name, ' ', m.display_name) AS full_name,
    c.display_name AS category,
    sc.display_name AS subcategory,
    CASE 
      WHEN LOWER(m.display_name) = LOWER(search_term) THEN 1.0
      WHEN LOWER(m.display_name) LIKE LOWER('%' || search_term || '%') THEN 0.8
      WHEN search_term = ANY(m.ml_aliases) THEN 0.9
      ELSE 0.5
    END AS confidence
  FROM models m
  JOIN brands b ON m.brand_id = b.id
  LEFT JOIN subcategory_brands sb ON b.id = sb.brand_id
  LEFT JOIN subcategories sc ON sb.subcategory_id = sc.id
  LEFT JOIN categories c ON sc.category_id = c.id
  WHERE m.is_active = true
    AND (
      LOWER(m.display_name) LIKE LOWER('%' || search_term || '%')
      OR LOWER(b.display_name) LIKE LOWER('%' || search_term || '%')
      OR search_term = ANY(m.ml_aliases)
    )
  ORDER BY confidence DESC
  LIMIT 10;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_form_for_context(p_category_id uuid DEFAULT NULL::uuid, p_subcategory_id uuid DEFAULT NULL::uuid, p_category_type_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(form_id uuid, form_name character varying, form_display_name character varying, sections jsonb, fields jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ft.id,
    ft.name,
    ft.display_name,
    ft.sections,
    jsonb_agg(
      jsonb_build_object(
        'id', ff.id,
        'field_name', ff.field_name,
        'field_label', ff.field_label,
        'section_id', ff.section_id,
        'field_type', ff.field_type,
        'field_width', ff.field_width,
        'data_source', ff.data_source,
        'data_source_config', ff.data_source_config,
        'is_required', ff.is_required,
        'validation_rules', ff.validation_rules,
        'placeholder', ff.placeholder,
        'help_text', ff.help_text,
        'icon', ff.icon,
        'options', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'value', ffo.option_value,
              'label', ffo.option_label
            ) ORDER BY ffo.display_order
          )
          FROM form_field_options_v2 ffo
          WHERE ffo.field_id = ff.id AND ffo.is_active = true
        )
      ) ORDER BY ff.display_order
    ) as fields
  FROM form_templates_v2 ft
  LEFT JOIN form_fields_v2 ff ON ff.form_template_id = ft.id
  WHERE ft.is_active = true
    AND (p_category_type_id IS NOT NULL AND ft.category_type_id = p_category_type_id
         OR p_subcategory_id IS NOT NULL AND ft.subcategory_id = p_subcategory_id
         OR p_category_id IS NOT NULL AND ft.category_id = p_category_id)
  GROUP BY ft.id, ft.name, ft.display_name, ft.sections
  ORDER BY ft.priority DESC
  LIMIT 1;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_full_category_name(ad_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  result TEXT;
BEGIN
  SELECT 
    ot.display_name || ' > ' || c.display_name || ' > ' || sc.display_name
  INTO result
  FROM ads a
  LEFT JOIN operation_types ot ON a.operation_type_id = ot.id
  LEFT JOIN categories c ON a.category_id = c.id
  LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
  WHERE a.id = ad_id;
  
  RETURN COALESCE(result, 'Sin categoría');
END;
$function$


CREATE OR REPLACE FUNCTION public.calculate_featured_refund(p_featured_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_credits_spent INT;
  v_duration_days INT;
  v_expires_at TIMESTAMPTZ;
  v_days_remaining INT;
  v_refund_amount INT;
BEGIN
  -- Obtener datos del featured
  SELECT 
    COALESCE(credits_spent, 1),
    duration_days,
    expires_at
  INTO v_credits_spent, v_duration_days, v_expires_at
  FROM featured_ads
  WHERE id = p_featured_id;
  
  -- Validar que existe y está activo
  IF NOT FOUND OR v_expires_at IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calcular días restantes
  v_days_remaining := EXTRACT(DAY FROM (v_expires_at - NOW()))::INT;
  
  -- Si ya expiró, no hay reembolso
  IF v_days_remaining <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Calcular reembolso proporcional (redondeo hacia arriba)
  v_refund_amount := CEIL(
    (v_days_remaining::DECIMAL / v_duration_days::DECIMAL) * v_credits_spent::DECIMAL
  )::INT;
  
  -- No puede ser mayor a los créditos originales
  IF v_refund_amount > v_credits_spent THEN
    v_refund_amount := v_credits_spent;
  END IF;
  
  RETURN v_refund_amount;
END;
$function$


CREATE OR REPLACE FUNCTION public.redeem_coupon(p_user_id uuid, p_code character varying)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_coupon RECORD;
  v_existing RECORD;
  v_new_balance INT;
BEGIN
  -- Buscar cupón válido
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND expires_at > NOW()
    AND current_redemptions < max_redemptions;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Cupón inválido, expirado o agotado');
  END IF;
  
  -- Verificar si ya canjeó este cupón
  SELECT * INTO v_existing
  FROM coupon_redemptions
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Ya canjeaste este cupón anteriormente');
  END IF;
  
  -- Incrementar contador de canjes del cupón
  UPDATE coupons
  SET current_redemptions = current_redemptions + 1
  WHERE id = v_coupon.id;
  
  -- Agregar créditos si corresponde - USAR user_featured_credits (tabla correcta)
  IF v_coupon.gives_credits AND v_coupon.credits_amount > 0 THEN
    -- Crear registro si no existe
    INSERT INTO user_featured_credits (user_id, credits_total, credits_used)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Actualizar credits_total
    UPDATE user_featured_credits
    SET 
      credits_total = credits_total + v_coupon.credits_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING (credits_total - credits_used) INTO v_new_balance;
    
    -- Registrar transacción en credit_transactions
    INSERT INTO credit_transactions (
      user_id, type, amount, balance_after, description, promo_code
    ) VALUES (
      p_user_id, 'coupon_redemption', v_coupon.credits_amount,
      v_new_balance, 'Cupón canjeado: ' || v_coupon.title, v_coupon.code
    );
  END IF;
  
  -- Registrar el canje
  INSERT INTO coupon_redemptions (
    coupon_id, user_id, credits_granted, membership_granted
  ) VALUES (
    v_coupon.id, p_user_id, 
    CASE WHEN v_coupon.gives_credits THEN v_coupon.credits_amount ELSE 0 END,
    CASE WHEN v_coupon.gives_membership THEN v_coupon.membership_plan_ids[1] ELSE NULL END
  );
  
  -- Calcular balance actual si no se asignaron créditos
  IF v_new_balance IS NULL THEN
    SELECT (credits_total - credits_used) INTO v_new_balance
    FROM user_featured_credits
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'credits_granted', CASE WHEN v_coupon.gives_credits THEN v_coupon.credits_amount ELSE 0 END,
    'membership_granted', v_coupon.gives_membership,
    'membership_all', COALESCE(v_coupon.membership_all, false),
    'membership_plan_ids', COALESCE(v_coupon.membership_plan_ids, '{}'),
    'new_balance', COALESCE(v_new_balance, 0),
    'message', '¡Cupón canjeado exitosamente!'
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.activate_featured_with_credits(p_user_id uuid, p_ad_id uuid, p_duration_days integer)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_credits_needed INT;
  v_current_balance INT;
  v_new_balance INT;
  v_category_id UUID;
  v_subcategory_id UUID;
  v_featured_id UUID;
  v_transaction_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_durations JSON;
BEGIN
  SELECT value::JSON INTO v_durations
  FROM public.global_config
  WHERE key = 'featured_durations';
  
  SELECT (elem ->> 'credits')::INT INTO v_credits_needed
  FROM jsonb_array_elements(v_durations::jsonb) AS elem
  WHERE (elem ->> 'days')::INT = p_duration_days;
  
  IF v_credits_needed IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Duración inválida',
      'valid_durations', v_durations
    );
  END IF;
  
  SELECT balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id;
  
  IF v_current_balance IS NULL OR v_current_balance < v_credits_needed THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Créditos insuficientes',
      'current_balance', COALESCE(v_current_balance, 0),
      'needed', v_credits_needed
    );
  END IF;
  
  SELECT category_id, subcategory_id 
  INTO v_category_id, v_subcategory_id
  FROM public.ads
  WHERE id = p_ad_id 
    AND user_id = p_user_id 
    AND status IN ('published', 'active');
  
  IF v_category_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aviso no encontrado o no publicado'
    );
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.featured_ads 
    WHERE ad_id = p_ad_id AND status = 'active'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este aviso ya está destacado'
    );
  END IF;
  
  UPDATE public.user_credits
  SET balance = balance - v_credits_needed
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  v_expires_at := NOW() + (p_duration_days || ' days')::INTERVAL;
  
  INSERT INTO public.credit_transactions (
    user_id, type, amount, balance_after, description
  ) VALUES (
    p_user_id,
    'spend',
    -v_credits_needed,
    v_new_balance,
    'Destacar aviso por ' || p_duration_days || ' días'
  ) RETURNING id INTO v_transaction_id;
  
  INSERT INTO public.featured_ads (
    ad_id, user_id, category_id, subcategory_id,
    duration_days, credits_spent, status,
    activated_at, expires_at, transaction_id
  ) VALUES (
    p_ad_id, p_user_id, v_category_id, v_subcategory_id,
    p_duration_days, v_credits_needed, 'active',
    NOW(), v_expires_at, v_transaction_id
  ) RETURNING id INTO v_featured_id;
  
  UPDATE public.credit_transactions
  SET featured_ad_id = v_featured_id
  WHERE id = v_transaction_id;
  
  RETURN json_build_object(
    'success', true,
    'featured_id', v_featured_id,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.grant_signup_promo(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_promo_active BOOLEAN;
  v_promo_credits INT;
  v_expiry_days INT;
  v_new_balance INT;
BEGIN
  SELECT value::BOOLEAN INTO v_promo_active
  FROM public.global_config WHERE key = 'promo_signup_active';
  
  IF NOT v_promo_active THEN
    RETURN json_build_object('success', false, 'error', 'Promoción no activa');
  END IF;
  
  SELECT value::INT INTO v_promo_credits
  FROM public.global_config WHERE key = 'promo_signup_credits';
  
  SELECT value::INT INTO v_expiry_days
  FROM public.global_config WHERE key = 'promo_signup_expiry_days';
  
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE user_id = p_user_id AND type = 'promo_grant'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Ya recibiste tu bono de bienvenida');
  END IF;
  
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (p_user_id, v_promo_credits)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_credits.balance + v_promo_credits
  RETURNING balance INTO v_new_balance;
  
  INSERT INTO public.credit_transactions (
    user_id, type, amount, balance_after, description, promo_code
  ) VALUES (
    p_user_id, 'promo_grant', v_promo_credits, v_new_balance,
    '🎁 Bono de Bienvenida - ¡Promoción Lanzamiento! (Vence en ' || v_expiry_days || ' días)',
    'WELCOME2026'
  );
  
  RETURN json_build_object(
    'success', true,
    'credits_granted', v_promo_credits,
    'expiry_days', v_expiry_days,
    'new_balance', v_new_balance
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$


CREATE OR REPLACE FUNCTION public.trigger_featured_ads_audit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo registrar cambios importantes
  IF (TG_OP = 'UPDATE' AND (
    OLD.status != NEW.status OR
    OLD.cancelled_at IS DISTINCT FROM NEW.cancelled_at OR
    OLD.expires_at != NEW.expires_at
  )) THEN
    
    INSERT INTO featured_ads_audit (
      featured_ad_id,
      ad_id,
      user_id,
      action,
      reason,
      metadata,
      created_at
    ) VALUES (
      NEW.id,
      NEW.ad_id,
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        WHEN NEW.status = 'expired' THEN 'expired'
        WHEN NEW.status = 'active' AND OLD.status != 'active' THEN 'activated'
        ELSE 'edited'
      END,
      NEW.cancelled_reason,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_expires_at', OLD.expires_at,
        'new_expires_at', NEW.expires_at,
        'refunded', NEW.refunded,
        'auto_trigger', true
      ),
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.grant_monthly_credits()
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user RECORD;
  v_granted_count INT := 0;
BEGIN
  FOR v_user IN
    SELECT 
      u.id as user_id,
      sp.monthly_free_credits,
      sp.monthly_credits_expire_days,
      uc.last_monthly_reset
    FROM public.users u
    JOIN public.subscription_plans sp ON u.subscription_plan_id = sp.id
    LEFT JOIN public.user_credits uc ON uc.user_id = u.id
    WHERE sp.monthly_free_credits > 0
      AND sp.monthly_free_credits < 999
      AND (uc.last_monthly_reset IS NULL 
           OR uc.last_monthly_reset < DATE_TRUNC('month', NOW()))
  LOOP
    INSERT INTO public.user_credits (user_id, balance, monthly_allowance, last_monthly_reset)
    VALUES (v_user.user_id, v_user.monthly_free_credits, v_user.monthly_free_credits, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET 
      balance = user_credits.balance + v_user.monthly_free_credits,
      monthly_allowance = v_user.monthly_free_credits,
      last_monthly_reset = NOW();
    
    INSERT INTO public.credit_transactions (
      user_id, type, amount, balance_after, description
    ) VALUES (
      v_user.user_id, 'monthly_grant', v_user.monthly_free_credits,
      (SELECT balance FROM public.user_credits WHERE user_id = v_user.user_id),
      'Créditos mensuales de membresía (Vencen en ' || v_user.monthly_credits_expire_days || ' días)'
    );
    
    v_granted_count := v_granted_count + 1;
  END LOOP;
  
  RETURN json_build_object('success', true, 'users_granted', v_granted_count);
END;
$function$


CREATE OR REPLACE FUNCTION public.get_featured_for_homepage(p_category_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(ad_id uuid, user_id uuid, featured_id uuid, priority integer, is_manual boolean)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH user_featured AS (
    -- 1. Usuarios que pagaron (1 por usuario, FIFO)
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      1 as priority,  -- Prioridad alta
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'homepage'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = false
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())  -- Defensivo: filtrar expirados
    ORDER BY fa.user_id, fa.created_at ASC  -- FIFO por usuario
  ),
  superadmin_featured AS (
    -- 2. Superadmin manual (ilimitado para rellenar)
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      2 as priority,  -- Prioridad baja
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'homepage'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())  -- Defensivo: filtrar expirados
    ORDER BY fa.created_at ASC  -- FIFO
  ),
  combined AS (
    -- Combinar ambos con prioridad
    SELECT * FROM user_featured
    UNION ALL
    SELECT * FROM superadmin_featured
  )
  SELECT 
    c.ad_id,
    c.user_id,
    c.featured_id,
    c.priority,
    c.is_manual
  FROM combined c
  ORDER BY c.priority ASC, c.featured_id ASC  -- Users primero, luego superadmin
  LIMIT p_limit;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_featured_for_results(p_category_id uuid, p_limit integer DEFAULT 4, p_offset integer DEFAULT 0)
 RETURNS TABLE(ad_id uuid, user_id uuid, featured_id uuid, priority integer, is_manual boolean)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH user_featured AS (
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      1 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'results'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = false
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.user_id, fa.created_at ASC
  ),
  superadmin_featured AS (
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      2 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'results'
      AND fa.category_id = p_category_id
      AND fa.status = 'active'
      AND fa.is_manual = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.created_at ASC
  ),
  combined AS (
    SELECT * FROM user_featured
    UNION ALL
    SELECT * FROM superadmin_featured
  )
  SELECT 
    c.ad_id,
    c.user_id,
    c.featured_id,
    c.priority,
    c.is_manual
  FROM combined c
  ORDER BY c.priority ASC, c.featured_id ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$


CREATE OR REPLACE FUNCTION public.get_featured_for_detail(p_category_id uuid, p_current_ad_id uuid, p_limit integer DEFAULT 6)
 RETURNS TABLE(ad_id uuid, user_id uuid, featured_id uuid, priority integer, is_manual boolean)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH user_featured AS (
    SELECT DISTINCT ON (fa.user_id)
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      1 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'detail'
      AND fa.category_id = p_category_id
      AND fa.ad_id != p_current_ad_id  -- Excluir aviso actual
      AND fa.status = 'active'
      AND fa.is_manual = false
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.user_id, fa.created_at ASC
  ),
  superadmin_featured AS (
    SELECT 
      fa.ad_id,
      fa.user_id,
      fa.id as featured_id,
      2 as priority,
      fa.is_manual
    FROM featured_ads fa
    WHERE fa.placement = 'detail'
      AND fa.category_id = p_category_id
      AND fa.ad_id != p_current_ad_id
      AND fa.status = 'active'
      AND fa.is_manual = true
      AND (fa.expires_at IS NULL OR fa.expires_at > NOW())
    ORDER BY fa.created_at ASC
  ),
  combined AS (
    SELECT * FROM user_featured
    UNION ALL
    SELECT * FROM superadmin_featured
  )
  SELECT 
    c.ad_id,
    c.user_id,
    c.featured_id,
    c.priority,
    c.is_manual
  FROM combined c
  ORDER BY c.priority ASC, c.featured_id ASC
  LIMIT p_limit;
END;
$function$


CREATE OR REPLACE FUNCTION public.admin_get_featured_audit(p_featured_ad_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, featured_ad_id uuid, action character varying, performed_by uuid, reason text, metadata jsonb, created_at timestamp with time zone, admin_email text, admin_name text, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered_audit AS (
    SELECT 
      faa.id,
      faa.featured_ad_id,
      faa.action,
      faa.performed_by,
      faa.reason,
      faa.metadata,
      faa.created_at,
      u.email as admin_email,
      u.full_name as admin_name
    FROM featured_ads_audit faa
    LEFT JOIN users u ON faa.performed_by = u.id
    WHERE (p_featured_ad_id IS NULL OR faa.featured_ad_id = p_featured_ad_id)
  ),
  total AS (
    SELECT COUNT(*) as cnt FROM filtered_audit
  )
  SELECT 
    fa.*,
    (SELECT cnt FROM total) as total_count
  FROM filtered_audit fa
  ORDER BY fa.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$


CREATE OR REPLACE FUNCTION public.admin_get_featured_ads(p_status character varying[] DEFAULT NULL::character varying[], p_placement character varying DEFAULT NULL::character varying, p_category_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid, p_search text DEFAULT NULL::text, p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, ad_id uuid, user_id uuid, placement text, category_id uuid, scheduled_start date, actual_start timestamp with time zone, expires_at timestamp with time zone, duration_days integer, status text, priority integer, credit_consumed boolean, refunded boolean, cancelled_by uuid, cancelled_reason text, cancelled_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, transaction_id uuid, ad_title text, ad_slug text, ad_images jsonb, ad_price numeric, ad_currency text, ad_status text, user_email text, user_full_name text, user_role text, category_name text, category_slug text, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered_ads AS (
    SELECT 
      fa.id,
      fa.ad_id,
      fa.user_id,
      fa.placement::TEXT as placement,
      fa.category_id,
      fa.scheduled_start,
      fa.actual_start,
      fa.expires_at,
      fa.duration_days,
      fa.status::TEXT as status,
      fa.priority,
      fa.credit_consumed,
      COALESCE(fa.refunded, FALSE) as refunded,
      fa.cancelled_by,
      fa.cancelled_reason,
      fa.cancelled_at,
      fa.created_at,
      fa.updated_at,
      fa.transaction_id,
      a.title::TEXT as ad_title,
      a.slug::TEXT as ad_slug,
      a.images as ad_images,
      a.price as ad_price,
      a.currency::TEXT as ad_currency,
      a.status::TEXT as ad_status,
      u.email::TEXT as user_email,
      u.full_name::TEXT as user_full_name,
      u.role::TEXT as user_role,
      c.name::TEXT as category_name,
      c.slug::TEXT as category_slug
    FROM featured_ads fa
    LEFT JOIN ads a ON fa.ad_id = a.id
    LEFT JOIN users u ON fa.user_id = u.id
    LEFT JOIN categories c ON fa.category_id = c.id
    WHERE 
      (p_status IS NULL OR fa.status = ANY(p_status))
      AND (p_placement IS NULL OR fa.placement = p_placement)
      AND (p_category_id IS NULL OR fa.category_id = p_category_id)
      AND (p_user_id IS NULL OR fa.user_id = p_user_id)
      AND (p_search IS NULL OR 
           a.title ILIKE '%' || p_search || '%' OR
           u.email ILIKE '%' || p_search || '%' OR
           u.full_name ILIKE '%' || p_search || '%')
      AND (p_date_from IS NULL OR fa.scheduled_start >= p_date_from)
      AND (p_date_to IS NULL OR fa.scheduled_start <= p_date_to)
  ),
  total AS (
    SELECT COUNT(*) as cnt FROM filtered_ads
  )
  SELECT 
    fa.*,
    (SELECT cnt FROM total) as total_count
  FROM filtered_ads fa
  ORDER BY fa.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$


CREATE OR REPLACE FUNCTION public.admin_cancel_featured_ad(p_featured_ad_id uuid, p_admin_id uuid, p_reason text DEFAULT NULL::text, p_refund boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_featured_ad RECORD;
  v_refund_amount INT := 0;
  v_user_balance INT;
  v_transaction_id UUID;
BEGIN
  -- Obtener featured ad
  SELECT * INTO v_featured_ad
  FROM featured_ads
  WHERE id = p_featured_ad_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Featured ad no encontrado');
  END IF;

  IF v_featured_ad.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Featured ad ya está cancelado');
  END IF;

  IF v_featured_ad.refunded = TRUE THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ya se realizó un reembolso anteriormente');
  END IF;

  -- Cancelar featured ad
  UPDATE featured_ads
  SET 
    status = 'cancelled',
    cancelled_by = p_admin_id,
    cancelled_reason = p_reason,
    cancelled_at = NOW(),
    refunded = p_refund,
    updated_at = NOW()
  WHERE id = p_featured_ad_id;

  -- Reembolso: calcular créditos según duration_days
  IF p_refund = TRUE THEN
    v_refund_amount := CASE v_featured_ad.duration_days
      WHEN 7 THEN 1
      WHEN 14 THEN 2
      WHEN 21 THEN 3
      WHEN 28 THEN 4
      ELSE 1
    END;
    
    -- Actualizar balance
    UPDATE user_credits
    SET balance = balance + v_refund_amount, updated_at = NOW()
    WHERE user_id = v_featured_ad.user_id;

    -- Registrar transacción de reembolso
    INSERT INTO credit_transactions (
      user_id, type, amount, balance_after, description, featured_ad_id, notes
    )
    SELECT 
      v_featured_ad.user_id,
      'refund',
      v_refund_amount,
      uc.balance,
      'Reembolso por cancelación de featured ad',
      p_featured_ad_id,
      p_reason
    FROM user_credits uc
    WHERE uc.user_id = v_featured_ad.user_id
    RETURNING id INTO v_transaction_id;

    SELECT balance INTO v_user_balance FROM user_credits WHERE user_id = v_featured_ad.user_id;
  END IF;

  -- Auditoría
  INSERT INTO featured_ads_audit (featured_ad_id, action, performed_by, reason, metadata)
  VALUES (
    p_featured_ad_id,
    CASE WHEN p_refund THEN 'refunded' ELSE 'cancelled' END,
    p_admin_id,
    p_reason,
    jsonb_build_object(
      'refund_amount', v_refund_amount,
      'new_balance', v_user_balance,
      'previous_status', v_featured_ad.status,
      'transaction_id', v_transaction_id
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'refunded', p_refund,
    'refund_amount', v_refund_amount,
    'user_balance', v_user_balance
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.admin_featured_stats(p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_active', COUNT(*) FILTER (WHERE status = 'active'),
    'total_pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'total_expired', COUNT(*) FILTER (WHERE status = 'expired'),
    'total_cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'total_credits_consumed', COUNT(*) FILTER (WHERE credit_consumed = TRUE AND (status != 'cancelled' OR refunded = FALSE)),
    'total_credits_refunded', COUNT(*) FILTER (WHERE refunded = TRUE),
    'avg_duration', COALESCE(AVG(duration_days), 0),
    'total_featured_ads', COUNT(*),
    'by_placement', (
      SELECT jsonb_object_agg(placement, cnt)
      FROM (
        SELECT placement, COUNT(*) as cnt
        FROM featured_ads
        WHERE (p_date_from IS NULL OR scheduled_start >= p_date_from)
          AND (p_date_to IS NULL OR scheduled_start <= p_date_to)
        GROUP BY placement
      ) sub
    ),
    'by_duration', (
      SELECT jsonb_object_agg(duration_days::TEXT, cnt)
      FROM (
        SELECT duration_days, COUNT(*) as cnt
        FROM featured_ads
        WHERE (p_date_from IS NULL OR scheduled_start >= p_date_from)
          AND (p_date_to IS NULL OR scheduled_start <= p_date_to)
        GROUP BY duration_days
      ) sub
    )
  ) INTO v_stats
  FROM featured_ads
  WHERE (p_date_from IS NULL OR scheduled_start >= p_date_from)
    AND (p_date_to IS NULL OR scheduled_start <= p_date_to);

  RETURN v_stats;
END;
$function$


CREATE OR REPLACE FUNCTION public.admin_get_occupancy_grid(p_year integer, p_month integer, p_placement character varying DEFAULT 'homepage'::character varying)
 RETURNS TABLE(category_id uuid, category_name text, category_slug text, date date, count_active integer, max_slots integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(v_start_date, v_end_date, '1 day'::INTERVAL)::DATE as date
  ),
  categories_list AS (
    SELECT id, name, slug FROM categories WHERE parent_id IS NULL
  ),
  grid AS (
    SELECT 
      cl.id as category_id,
      cl.name::TEXT as category_name,
      cl.slug::TEXT as category_slug,
      d.date,
      10 as max_slots
    FROM dates d
    CROSS JOIN categories_list cl
  )
  SELECT 
    g.category_id,
    g.category_name::TEXT,
    g.category_slug::TEXT,
    g.date,
    COUNT(fa.id)::INT as count_active,
    g.max_slots
  FROM grid g
  LEFT JOIN featured_ads fa ON 
    fa.category_id = g.category_id
    AND fa.placement = p_placement
    AND fa.status = 'active'
    AND fa.scheduled_start <= g.date
    AND (fa.expires_at IS NULL OR DATE(fa.expires_at) >= g.date)
  GROUP BY g.category_id, g.category_name, g.category_slug, g.date, g.max_slots
  ORDER BY g.category_name, g.date;
END;
$function$


