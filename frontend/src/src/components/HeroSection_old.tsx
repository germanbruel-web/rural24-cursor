import React from 'react';
import { Container, Title, Text, Box, Grid } from '@mantine/core';
import { SearchBar } from './SearchBar';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, isLoading }) => {
  return (
    <Box style={{
      background: 'linear-gradient(135deg, #16a135 0%, #1b2f23 100%)',
      paddingTop: '100px',
      paddingBottom: '80px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative floating elements */}
      <Box style={{
        position: 'absolute',
        top: '-50px',
        right: '-100px',
        width: '400px',
        height: '400px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '50%',
        zIndex: 0,
      }} />
      <Box style={{
        position: 'absolute',
        bottom: '-100px',
        left: '-150px',
        width: '500px',
        height: '500px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '50%',
        zIndex: 0,
      }} />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <Box style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Title style={{
            fontSize: '56px',
            fontWeight: 900,
            color: 'white',
            lineHeight: 1.1,
            marginBottom: '20px',
            letterSpacing: '-1px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}>
            Encontrá todo para el agro
          </Title>
          <Text style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.95)',
            fontWeight: 400,
            marginBottom: '48px',
            lineHeight: 1.6,
            maxWidth: '700px',
            margin: '0 auto 48px',
          }}>
            El primer motor de búsqueda inteligente especializado en productos y servicios agropecuarios argentinos.
          </Text>
        </Box>

        {/* SearchBar */}
        <Box style={{ marginBottom: '80px', maxWidth: '600px', margin: '0 auto 80px' }}>
          <SearchBar onSearch={onSearch} isLoading={isLoading} />
        </Box>

        {/* Stats Grid */}
        <Grid gutter="xl" justify="center">
          {[
            { number: '1000+', label: 'Productos' },
            { number: '50+', label: 'Proveedores' },
            { number: '24/7', label: 'Disponible' },
          ].map((stat, idx) => (
            <Grid.Col key={idx} span={{ base: 12, sm: 6, md: 3 }}>
              <Box
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  borderRadius: '12px',
                  background: 'rgba(229, 162, 31, 0.15)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(229, 162, 31, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(229, 162, 31, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(229, 162, 31, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Title style={{
                  fontSize: '40px',
                  fontWeight: 900,
                  color: '#e5a21f',
                  marginBottom: '8px',
                  letterSpacing: '-0.5px',
                }}>
                  {stat.number}
                </Title>
                <Text style={{
                  fontSize: '15px',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {stat.label}
                </Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
