"""
CapiSafe — Servidor Local Maritaca AI (Sabiá-3)

Proxy local que guarda a API Key server-side (não exposta no browser).
Roda em http://localhost:5001

Uso:
    MARITACA_API_KEY=sua_chave_aqui python3 servidor.py
    ou
    Edite a variável MARITACA_API_KEY_HARDCODED abaixo diretamente.
"""

import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Permite chamadas do frontend (porta 3333) para este servidor (5001)

# ──────────────────────────────────────────────────────────────────────────────
# CONFIGURAÇÃO — coloque sua chave aqui OU exporte como variável de ambiente:
#   export MARITACA_API_KEY="110672..."
# ──────────────────────────────────────────────────────────────────────────────
MARITACA_API_KEY_HARDCODED = "101513982137146565351_be7d5e1e51b6439e"

MARITACA_API_KEY = os.environ.get("MARITACA_API_KEY", MARITACA_API_KEY_HARDCODED)
MARITACA_ENDPOINT = "https://chat.maritaca.ai/api/chat/completions"

# ──────────────────────────────────────────────────────────────────────────────
# PROMPT DO SISTEMA — Capi Bot especialista em golpes
# ──────────────────────────────────────────────────────────────────────────────
SYSTEM_INSTRUCTION = """Você é o "Capi Bot", especialista virtual do projeto CapiSafe (plataforma brasileira de segurança cibernética).
Seu objetivo é ajudar cidadãos a detectar golpes virtuais de forma amigável, ética e direta.

Regras:
1. Responda sempre em português (Brasil), de forma concisa e instrutiva. Use bullet points e negrito.
2. Seu tom é de um especialista vigilante digital amigável.
3. Se o usuário fornecer poucos detalhes, faça UMA pergunta de cada vez para entender o caso.
4. Se identificar um golpe provável, forneça:
   - Veredito de risco: "⚠️ RISCO: ALTO", "🟡 RISCO: MÉDIO" ou "🟢 RISCO: BAIXO"
   - Explicação breve do mecanismo do golpe
   - Recomendações urgentes de proteção
5. Incentive o usuário a usar a aba "Capi, é golpe?" para gerar um dossiê técnico completo.
6. Nunca responda perguntas fora de segurança digital / golpes."""


def call_maritaca(messages: list, temperature: float = 0.7, max_tokens: int = 500) -> dict:
    """Chama a API da Maritaca AI e retorna o objeto de resposta."""
    if not MARITACA_API_KEY:
        return {"error": "MARITACA_API_KEY não configurada no servidor."}

    headers = {
        "Authorization": f"Bearer {MARITACA_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "sabia-3",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    resp = requests.post(MARITACA_ENDPOINT, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


# ──────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/api/status", methods=["GET"])
def status():
    """Health check — o frontend testa este endpoint para saber se o servidor está ativo."""
    return jsonify({
        "online": True,
        "modelo": "sabia-3",
        "chave_configurada": bool(MARITACA_API_KEY),
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Chat com a CapiBot.
    Body: { "history": [...mensagens anteriores], "message": "texto do usuário" }
    """
    data = request.get_json(force=True)
    user_message = data.get("message", "").strip()
    history = data.get("history", [])  # lista de {role, content} anteriores

    if not user_message:
        return jsonify({"error": "Campo 'message' vazio."}), 400

    messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]
    messages += history[-10:]  # últimas 10 trocas para manter contexto
    messages.append({"role": "user", "content": user_message})

    try:
        result = call_maritaca(messages, temperature=0.7, max_tokens=500)
        if "error" in result:
            return jsonify(result), 503
        reply = result["choices"][0]["message"]["content"].strip()
        return jsonify({"reply": reply})
    except requests.exceptions.Timeout:
        return jsonify({"error": "Timeout ao contactar a Maritaca AI."}), 504
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Análise de relato de golpe para a página relato.html / resultado.html
    Body: { "titulo": "...", "descricao": "...", "triagem": { idade, regiao, familiaridade, canal } }
    """
    data = request.get_json(force=True)
    titulo = data.get("titulo", "")
    descricao = data.get("descricao", "")
    triagem = data.get("triagem", {})

    prompt = f"""Você é o "Capi", analista especialista em cibersegurança do projeto CapiSafe.
Analise o relato e retorne EXCLUSIVAMENTE um JSON válido (sem markdown, sem texto extra).

RELATO:
Título: {titulo}
Descrição: {descricao}

TRIAGEM:
Faixa Etária: {triagem.get('idade', 'Não informada')}
Região: {triagem.get('regiao', 'Não informada')}
Familiaridade Digital: {triagem.get('familiaridade', 'Não informada')}
Canal: {triagem.get('canal', 'Não informado')}

REGRAS:
- risco: 0-100
- nivel: "BAIXO", "MÉDIO" ou "ALTO"
- areaId: "whatsapp" | "ecommerce" | "bancos" | "phishing" | "relacionamento"
- areaProvavel: nome legível da área
- explicacao: texto fluido explicando o golpe
- caracteristicas: array de {{nome, descricao}}
- recomendacoes: array de strings com ações concretas

EXEMPLO DE RETORNO:
{{
  "risco": 85,
  "nivel": "ALTO",
  "areaProvavel": "Fraudes em Aplicativos de Mensagens",
  "areaId": "whatsapp",
  "explicacao": "...",
  "caracteristicas": [{{"nome": "Pressão Emocional", "descricao": "..."}}],
  "recomendacoes": ["Ligue para o número antigo do familiar.", "..."]
}}"""

    messages = [
        {"role": "system", "content": "Você é um analista de cibersegurança brasileiro. Responda EXCLUSIVAMENTE com JSON válido."},
        {"role": "user", "content": prompt},
    ]

    try:
        result = call_maritaca(messages, temperature=0.1, max_tokens=800)
        if "error" in result:
            return jsonify(result), 503
        raw = result["choices"][0]["message"]["content"].strip()
        analise = json.loads(raw)
        return jsonify(analise)
    except json.JSONDecodeError:
        return jsonify({"error": "Resposta da IA não era JSON válido.", "raw": raw}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"\n🦫 CapiSafe — Servidor Maritaca AI rodando em http://localhost:{port}")
    print(f"   Modelo  : sabia-3")
    print(f"   Chave   : {'✅ configurada' if MARITACA_API_KEY else '❌ NÃO configurada — edite servidor.py ou exporte MARITACA_API_KEY'}")
    print(f"   CORS    : habilitado (aceita chamadas do frontend em :3333)\n")
    app.run(host="0.0.0.0", port=port, debug=False)
