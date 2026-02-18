# 🏦 Belem Bank - Front-end Experience

O **Belem Bank** é uma plataforma bancária moderna desenvolvida em **Angular 19**. O foco principal deste projeto é demonstrar o domínio de fluxos assíncronos complexos, gestão de estado reativa com RxJS e uma rigorosa política de **Testes Unitários**, atingindo níveis de cobertura de nível enterprise.

> **🔗 Link para o Core API (Back-end):** [Acesse o Repositório Dev aqui](link-do-seu-back)

---

## 💎 Destaques Técnicos

### 🧪 Testes de Alta Cobertura (+97%)
Diferente de projetos convencionais, o Belem Bank foi construído sob uma cultura de qualidade extrema.
* **Unit Testing:** Implementação de testes para Components e Services utilizando Jasmine e Karma.
* **Advanced Mocking:** Mocks avançados para bibliotecas de terceiros como `SweetAlert2`, `html2canvas` e `jsPDF`.
* **Full Coverage:** Relatórios de cobertura que garantem 100% de sucesso em funções críticas de negócio, como o processamento de extratos e cálculos de saldo.

### ⚡ Performance & Arquitetura
* **Standalone Components:** Arquitetura limpa e modular, reduzindo o bundle size e facilitando a manutenção.
* **Reactive UI:** Uso extensivo de `BehaviorSubject` para gerenciar o estado do usuário de forma segura e reativa.
* **Type Safety:** Interfaces e DTOs rigorosos para garantir a integridade dos dados trafegados entre a API e a Interface.

---

## 🚀 Funcionalidades Principais

| Recurso | Descrição |
| :--- | :--- |
| **Extrato Inteligente** | Filtros reativos por tipo (PIX, Saque, Depósito) e períodos (7, 15, 30 dias ou customizado). |
| **Exportação PDF** | Motor de renderização que transforma o extrato HTML em documentos PDF profissionais com nomeação dinâmica. |
| **UX Administrativo** | Dashboard completo para gestão de agências e monitoramento de clientes em tempo real. |
| **Automação de Endereço** | Integração com a API ViaCep para preenchimento automático de endereços via CEP. |

---

## 🛠️ Stack Tecnológica

* **Framework:** Angular 19 (Standalone)
* **Estilização:** CSS3 Moderno (Variáveis, Flexbox, Grid)
* **Notificações:** SweetAlert2 (Modais e Toasts dinâmicos)
* **Documentação:** jsPDF & html2canvas
* **Segurança:** Route Guards & Interceptors para gestão de tokens JWT.

---

## 📂 Organização do Projeto

```text
src/app/
├── core/           # Guards, Interceptors e Modelos globais
├── services/       # Lógica de consumo de API (Auth, Cep, Cliente, Agencia)
├── pages/          # Componentes de página (Dashboard, Login, Cadastro)
│   └── dashboard/
│       └── components/   # Sub-componentes reutilizáveis (Perfil, Listagem)
└── environment/    # Configurações de endpoints e chaves de acesso
```

## 🏁 Como Iniciar
Clone o projeto

```
git clone [https://github.com/devebsjunior/sistema-bancario-front.git](https://github.com/devebsjunior/sistema-bancario-front.git)
```
Instale as dependências

```
npm install
```
Execute os testes (Relatório de Cobertura)

```
ng test --code-coverage
```

Suba a aplicação
```
ng serve
```








