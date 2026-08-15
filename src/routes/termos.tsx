import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [{ title: "Termos de Uso — VendaBot" }],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-foreground">
      <h1 className="font-display mb-2 text-2xl font-bold">Termos de Uso — VendaBot</h1>
      <p className="mb-8 text-xs text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>

      <Secao titulo="1. O que é o VendaBot">
        <p>
          O VendaBot é uma ferramenta de automação de marketing para afiliados,
          que conecta à sua conta pessoal do WhatsApp para enviar mensagens
          automáticas de ofertas em grupos que você escolhe, em horários que
          você configura, com textos gerados por inteligência artificial.
        </p>
      </Secao>

      <Secao titulo="2. Cadastro e plano">
        <p>
          Para usar o VendaBot, você precisa criar uma conta e assinar um dos
          planos disponíveis. O acesso ao painel é liberado automaticamente
          após a confirmação do pagamento, e cada plano tem limites próprios
          de quantidade de grupos e horários, conforme descrito na tela de
          planos no momento da assinatura.
        </p>
      </Secao>

      <Secao titulo="3. Cobrança recorrente">
        <p>
          A assinatura é cobrada de forma recorrente (mensal), automaticamente,
          na mesma forma de pagamento usada na contratação, através da
          plataforma de pagamentos Cakto. Você pode cancelar a renovação
          automática a qualquer momento; o cancelamento impede cobranças
          futuras, mas não gera reembolso automático do período já pago,
          exceto quando exigido por lei.
        </p>
      </Secao>

      <Secao titulo="4. Cancelamento e reembolso">
        <p>
          Você pode cancelar sua assinatura a qualquer momento pelo painel de
          pagamento da Cakto. Conforme o Código de Defesa do Consumidor,
          compras feitas fora de estabelecimento comercial (como pela
          internet) podem ser canceladas em até 7 dias corridos após a
          contratação, com reembolso integral, desde que o serviço não tenha
          sido efetivamente utilizado de forma substancial nesse período.
        </p>
      </Secao>

      <Secao titulo="5. Uso do WhatsApp e riscos">
        <p>
          O VendaBot se conecta à sua conta do WhatsApp como um "aparelho
          vinculado", da mesma forma que o WhatsApp Web. O WhatsApp tem suas
          próprias regras de uso, e o envio de mensagens automáticas ou em
          massa, especialmente em grupos onde você não é administrador, pode
          resultar na suspensão ou banimento do seu número pelo WhatsApp.
        </p>
        <p className="mt-2">
          Você é o único responsável pela forma como usa a ferramenta,
          incluindo em quais grupos envia mensagens e a frequência dos envios.
          O VendaBot não se responsabiliza por bloqueios, banimentos ou
          restrições aplicados pelo WhatsApp à sua conta.
        </p>
      </Secao>

      <Secao titulo="6. Conteúdo enviado">
        <p>
          Você é responsável pelos produtos, links de afiliado, preços e
          informações que cadastra na plataforma. O VendaBot gera o texto das
          mensagens automaticamente com base nesses dados, mas não verifica a
          veracidade das informações de preço, disponibilidade ou legitimidade
          dos links cadastrados — essa responsabilidade é sua.
        </p>
      </Secao>

      <Secao titulo="7. Dados pessoais (LGPD)">
        <p>
          Coletamos e armazenamos os dados necessários para o funcionamento do
          serviço: seu e-mail de cadastro, os produtos/grupos/horários que
          você configura, e as credenciais de sessão do WhatsApp (guardadas de
          forma isolada por conta, sem acesso de outros usuários). Não
          vendemos nem compartilhamos seus dados com terceiros para fins de
          marketing.
        </p>
      </Secao>

      <Secao titulo="8. Disponibilidade do serviço">
        <p>
          Fazemos o possível para manter o VendaBot disponível 24 horas por
          dia, mas não garantimos disponibilidade ininterrupta. Instabilidades
          no WhatsApp, nos provedores de hospedagem ou no banco de dados podem
          causar interrupções temporárias, sem gerar direito a reembolso
          proporcional, salvo interrupções prolongadas e continuadas.
        </p>
      </Secao>

      <Secao titulo="9. Alterações nestes termos">
        <p>
          Podemos atualizar estes termos periodicamente. Mudanças relevantes
          serão comunicadas por e-mail ou dentro do próprio painel. O uso
          continuado do VendaBot após uma alteração representa a aceitação dos
          novos termos.
        </p>
      </Secao>

      <Secao titulo="10. Contato">
        <p>
          Dúvidas sobre estes termos podem ser enviadas para o e-mail de
          suporte informado no painel.
        </p>
      </Secao>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-display mb-2 text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}
