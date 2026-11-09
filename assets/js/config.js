/* Gerado pelo backoffice — não editar à mão. Para alterar, usa o backoffice. */
window.LIMPARTE_CONFIG = {
  "geral": {
    "formspreeEndpoint": "",
    "whatsapp": "351912320585",
    "telefone": "+351912320585",
    "email": "geral@limparte.com.pt"
  },
  "simulador": {
    "tarifas": {
      "telhado_fachada": {
        "rotulo": "Limpeza de Telhado / Fachada",
        "base": 3.5
      },
      "pintura": {
        "rotulo": "Pintura Exterior / Interior",
        "base": 8
      },
      "paineis": {
        "rotulo": "Painéis Solares",
        "base": 14
      },
      "caleiras": {
        "rotulo": "Caleiras e Impermeabilização",
        "base": 12
      },
      "obras_pavimentos": {
        "rotulo": "Pequenas Obras e Pavimentos",
        "base": 5
      },
      "vidros": {
        "rotulo": "Vidros em Altura e Pavimentos",
        "base": 5
      }
    },
    "escalas": {
      "telhado_fachada": {
        "min": 30,
        "max": 600,
        "passo": 10,
        "omissao": 150,
        "unidade": "m²",
        "rotulo": "Área aproximada da cobertura"
      },
      "pintura": {
        "min": 30,
        "max": 600,
        "passo": 10,
        "omissao": 150,
        "unidade": "m²",
        "rotulo": "Área aproximada a pintar"
      },
      "paineis": {
        "min": 4,
        "max": 60,
        "passo": 1,
        "omissao": 12,
        "unidade": "painéis",
        "rotulo": "Quantos painéis tem?"
      },
      "caleiras": {
        "min": 10,
        "max": 200,
        "passo": 5,
        "omissao": 40,
        "unidade": "m lineares",
        "rotulo": "Metros de caleira, aproximadamente"
      },
      "obras_pavimentos": {
        "min": 10,
        "max": 400,
        "passo": 10,
        "omissao": 60,
        "unidade": "m²",
        "rotulo": "Área aproximada da intervenção"
      },
      "vidros": {
        "min": 20,
        "max": 1000,
        "passo": 10,
        "omissao": 150,
        "unidade": "m²",
        "rotulo": "Área de vidro ou pavimento"
      }
    },
    "multiplicadores": {
      "Prédio": 1.25,
      "Armazém": 0.9
    },
    "minimoFaturavel": 180
  },
  "cenarios": {
    "telhado_fachada": {
      "alternativas": [
        {
          "rotulo": "Substituir a cobertura, quando já não for possível limpar",
          "tipo": "m2",
          "min": 45,
          "max": 70
        }
      ],
      "remate": "A manutenção periódica adia essa despesa 15 a 20 anos."
    },
    "pintura": {
      "custoAno": {
        "vidaSistema": 12,
        "rivalRotulo": "Pintura rápida, sem preparação",
        "rivalM2": 4.5,
        "rivalVida": 4
      }
    },
    "paineis": {
      "energia": {
        "kwpPorPainel": 0.45,
        "kwhPorKwpAno": 1450,
        "perda": 0.15,
        "precoKwh": 0.18
      }
    },
    "caleiras": {
      "alternativas": [
        {
          "rotulo": "Impermeabilização integral com tela armada em fibra",
          "tipo": "m2",
          "min": 35,
          "max": 55
        },
        {
          "rotulo": "Substituir a caleira por completo",
          "tipo": "m2",
          "min": 60,
          "max": 90
        },
        {
          "rotulo": "Reparar teto, isolamento e pintura depois de uma infiltração",
          "tipo": "fixo",
          "min": 1500,
          "max": 4000,
          "alerta": true
        }
      ]
    },
    "obras_pavimentos": {
      "alternativas": [
        {
          "rotulo": "Refazer o pano de reboco por completo",
          "tipo": "m2",
          "min": 18,
          "max": 30
        }
      ]
    },
    "vidros": {
      "alternativas": [
        {
          "rotulo": "Montar andaime ou plataforma elevatória para o mesmo trabalho",
          "tipo": "fixo",
          "min": 800,
          "max": 2500
        }
      ],
      "remate": "Até cerca de 17 metros chegamos com varas telescópicas, sem montagem nem ocupação de via pública."
    }
  },
  "estados": {
    "Bom": {
      "icone": "visto",
      "classe": "e-bom",
      "nota": "Manutenção preventiva. É o momento mais barato para intervir — e o que faz a intervenção durar mais."
    },
    "Razoável": {
      "icone": "info",
      "classe": "e-razoavel",
      "nota": "Situação habitual. A manutenção resolve e evita que o problema passe a ser estrutural."
    },
    "Degradado": {
      "icone": "alerta",
      "classe": "e-degradado",
      "nota": "Pelo que descreve, a manutenção pode não ser suficiente. Preferimos ver ao local antes de lhe dar um número."
    }
  },
  "textos": {
    "js.sim.enviar": "Enviar pedido",
    "js.form.ok_email": "Obrigado {nome}! Recebemos o seu pedido e entramos em contacto dentro de 24 horas úteis.",
    "js.form.ok_whatsapp": "Obrigado {nome}! Abrimos o WhatsApp com o seu pedido preenchido — só precisa de tocar em enviar.",
    "js.form.nao_abriu": "Não abriu? Toque aqui",
    "js.form.falhou": "Não conseguimos enviar o pedido pela internet. Envie-nos por WhatsApp — a mensagem já vai preenchida.",
    "js.form.falhou_botao": "Enviar por WhatsApp",
    "js.valida.nome": "Indique o seu nome.",
    "js.valida.telefone": "Indique um número de telemóvel ou telefone português válido (9 dígitos).",
    "js.valida.email": "O endereço de email não parece válido.",
    "js.valida.consentimento": "É necessário autorizar o contacto para podermos responder.",
    "js.sim.visita": "Pedir visita técnica",
    "js.passo.1": "Selecione o serviço",
    "js.passo.2": "Tipo de imóvel e área estimada",
    "js.passo.3": "Os seus dados para envio do orçamento",
    "js.aval.vazio_titulo": "Ainda não há avaliações publicadas para este serviço.",
    "js.aval.vazio_texto": "Foi nosso cliente? Adoraríamos ouvir a sua opinião.",
    "js.trab.vazio_titulo": "Os trabalhos deste serviço estão a ser preparados para publicação.",
    "js.trab.vazio_texto": "Contacte-nos e mostramos-lhe o portefólio completo."
  }
};
