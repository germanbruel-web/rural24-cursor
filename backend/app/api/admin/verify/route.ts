import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = getSupabaseClient();
    
    // Verificar token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado', details: authError?.message },
        { status: 401 }
      );
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que sea superadmin
    if (profile.role !== 'superadmin' && profile.role !== 'super-admin') {
      return NextResponse.json(
        { 
          error: 'Acceso denegado',
          hint: `Requiere rol superadmin. Tu rol: ${profile.role}` 
        },
        { status: 403 }
      );
    }

    // Retornar datos del usuario autenticado
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: profile.role,
        fullName: profile.full_name,
      }
    });

  } catch (error: any) {
    console.error('Error en verificación admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
