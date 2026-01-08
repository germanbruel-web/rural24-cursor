/**
 * Admin Routes - Autenticación y autorización de superadmin
 */

import { FastifyPluginAsync } from 'fastify';
import { getSupabaseClient } from '../infrastructure/supabase/client.js';

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/admin/verify - Verificar token de superadmin
  fastify.get('/verify', async (request, reply) => {
    try {
      // Obtener token del header Authorization
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          error: 'Token no proporcionado',
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const supabase = getSupabaseClient();

      // Verificar token con Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return reply.status(401).send({
          error: 'Token inválido o expirado',
          details: authError?.message,
        });
      }

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, role, full_name')
        .eq('id', user.id)
        .maybeSingle<{
          id: string;
          email: string;
          role: string;
          full_name: string;
        }>();

      if (profileError || !profile) {
        return reply.status(404).send({
          error: 'Perfil de usuario no encontrado',
        });
      }

      // Verificar que sea superadmin
      if (profile.role !== 'superadmin' && profile.role !== 'super-admin') {
        return reply.status(403).send({
          error: 'Acceso denegado',
          message: 'Se requiere rol de superadmin',
        });
      }

      return reply.send({
        success: true,
        user: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};
