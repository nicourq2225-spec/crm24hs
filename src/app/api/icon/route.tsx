import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sizeParam = searchParams.get('size') || '192';
  const size = parseInt(sizeParam, 10);

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: size * 0.6,
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: size * 0.25,
        }}
      >
        🛡️
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
