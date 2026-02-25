# 🎨 Layer Up — SaaS Design System
Versão 1.0  
Baseado na identidade estratégica e visual da Layer Up

---

# 1. Princípios da Marca

## 1.1 Essência

A Layer Up representa:

- Ousadia
- Crescimento
- Estratégia orientada por dados
- Transformação digital
- Performance

O design do SaaS deve refletir:

- Clareza
- Confiança
- Modernidade
- Inteligência visual
- Consistência

---

# 2. Fundamentos Visuais

## 2.1 Paleta de Cores

### Cores Primárias

| Token | Hex | Uso |
|-------|------|------|
| --color-primary | #0A1F44 | Navegação, headers, áreas institucionais |
| --color-accent | #8A2BE2 | Botões principais, CTAs |
| --color-dark | #1F1F1F | Texto principal |
| --color-light | #F5F6FA | Backgrounds neutros |

### Cores de Suporte

| Token | Hex | Uso |
|-------|------|------|
| --color-success | #00C896 | Indicadores positivos |
| --color-warning | #FFC857 | Alertas moderados |
| --color-error | #E63946 | Erros |
| --color-info | #3A86FF | Informações |

---

## 2.2 Escala de Cinzas

| Token | Hex |
|-------|------|
| --gray-100 | #FAFAFA |
| --gray-200 | #F1F1F1 |
| --gray-300 | #E0E0E0 |
| --gray-400 | #BDBDBD |
| --gray-500 | #9E9E9E |
| --gray-600 | #616161 |
| --gray-700 | #424242 |
| --gray-800 | #2C2C2C |

---

# 3. Tipografia

## 3.1 Fontes

- Primária: Inter
- Alternativa para títulos: Montserrat

## 3.2 Escala Tipográfica

| Elemento | Tamanho | Peso |
|----------|----------|------|
| H1 | 40px | 700 |
| H2 | 32px | 700 |
| H3 | 24px | 600 |
| H4 | 20px | 600 |
| Body Large | 18px | 400 |
| Body | 16px | 400 |
| Small | 14px | 400 |
| Caption | 12px | 400 |

Line-height padrão: 1.5

---

# 4. Espaçamento

Sistema baseado em múltiplos de 8px.

| Token | Valor |
|-------|--------|
| --space-1 | 4px |
| --space-2 | 8px |
| --space-3 | 16px |
| --space-4 | 24px |
| --space-5 | 32px |
| --space-6 | 48px |
| --space-7 | 64px |

---

# 5. Grid System

- 12 colunas
- Gutter: 24px
- Container máximo: 1280px
- Layout responsivo

Breakpoints:

| Nome | Largura |
|------|----------|
| xs | < 640px |
| sm | ≥ 640px |
| md | ≥ 768px |
| lg | ≥ 1024px |
| xl | ≥ 1280px |

---

# 6. Componentes

## 6.1 Botões

### Primary Button
- Background: --color-accent
- Texto: branco
- Hover: escurecer 8%
- Border-radius: 8px
- Padding: 12px 20px

### Secondary Button
- Background: transparente
- Border: 1px solid --color-primary
- Texto: --color-primary

### Danger Button
- Background: --color-error
- Texto: branco

---

## 6.2 Inputs

- Altura: 44px
- Border-radius: 8px
- Border: 1px solid --gray-300
- Focus: border --color-accent
- Padding interno: 12px

---

## 6.3 Cards

- Background: branco
- Border-radius: 16px
- Padding: 24px
- Shadow: leve (0 4px 12px rgba(0,0,0,0.05))

---

## 6.4 Tabelas

- Header: fundo --gray-200
- Texto header: --color-primary
- Linhas alternadas: --gray-100
- Hover row: --gray-200

---

## 6.5 Badges

| Tipo | Cor |
|------|------|
| Success | --color-success |
| Warning | --color-warning |
| Error | --color-error |
| Info | --color-info |

---

# 7. Ícones

- Biblioteca recomendada: Lucide Icons
- Espessura padrão: 1.5
- Tamanho padrão: 20px / 24px

---

# 8. Ilustração e Visual

Estilo:

- Moderno
- Minimalista
- Tecnológico
- Gradientes sutis (roxo → azul)

Evitar:

- Elementos exageradamente decorativos
- Sombras pesadas
- Cores fora da paleta oficial

---

# 9. Estados de Interface

## Hover
Escurecer 5–8% ou aplicar leve elevação.

## Focus
Outline 2px --color-accent.

## Disabled
- Opacidade 0.5
- Cursor not-allowed

---

# 10. Motion & Animação

Duração padrão:

- Microinteração: 150ms
- Transição média: 250ms
- Modal/Drawer: 300ms

Easing padrão:
ease-in-out

Evitar animações exageradas.

---

# 11. Dashboard Patterns

## Cards de Métrica

Estrutura:

- Label pequena
- Valor grande
- Variação percentual
- Indicador visual (↑ ↓)

## Gráficos

- Usar cores da paleta
- Evitar mais de 5 cores simultâneas
- Tooltip escuro com texto claro

---

# 12. Dark Mode (Opcional Futuro)

Background principal: #0F172A  
Cards: #1E293B  
Texto principal: #F8FAFC  
Accent permanece roxo

---

# 13. Tom Visual

O SaaS deve parecer:

✔ Inteligente  
✔ Estratégico  
✔ Profissional  
✔ Confiável  
✔ Escalável  

Nunca:

✖ Infantil  
✖ Poluído  
✖ Visualmente instável  
✖ Exagerado  

---

# 14. Design Tokens Base (CSS Example)

```css
:root {
  --color-primary: #0A1F44;
  --color-accent: #8A2BE2;
  --color-success: #00C896;
  --color-warning: #FFC857;
  --color-error: #E63946;
  --color-info: #3A86FF;

  --radius-sm: 8px;
  --radius-md: 16px;

  --transition-fast: 150ms ease-in-out;
  --transition-default: 250ms ease-in-out;
}