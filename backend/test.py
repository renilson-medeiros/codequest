# backend/test_spotify.py
"""
Script para testar se as credenciais Spotify estão carregando
"""

import os
from dotenv import load_dotenv

# Carregar .env
load_dotenv()

print("=" * 50)
print("TESTE DE CREDENCIAIS SPOTIFY")
print("=" * 50)

client_id = os.getenv("SPOTIFY_CLIENT_ID")
client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
redirect_uri = os.getenv("SPOTIFY_REDIRECT_URI")

print(f"\nSPOTIFY_CLIENT_ID: {client_id[:10] + '...' if client_id else '❌ NÃO ENCONTRADO'}")
print(f"SPOTIFY_CLIENT_SECRET: {client_secret[:10] + '...' if client_secret else '❌ NÃO ENCONTRADO'}")
print(f"SPOTIFY_REDIRECT_URI: {redirect_uri if redirect_uri else '❌ NÃO ENCONTRADO'}")

print("\n" + "=" * 50)

if not client_id or not client_secret:
    print("❌ ERRO: Credenciais não configuradas!")
    print("\nVerifique se o arquivo .env existe em backend/.env")
    print("E se contém:")
    print("SPOTIFY_CLIENT_ID=seu_id_aqui")
    print("SPOTIFY_CLIENT_SECRET=seu_secret_aqui")
else:
    print("✅ Credenciais carregadas com sucesso!")