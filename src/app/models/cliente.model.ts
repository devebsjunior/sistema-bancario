export interface ClienteDTO {
  idCliente?: number;
  nome: string;
  cpf: string;
  email: string;
  senha?: string;
  profile: string;
  enderecoCliente: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  conta?: {
    idConta?: number;
    numeroConta?: string;
    digito?: string;
    saldo: number;
    agencia?: {
      id?: number; 
      numeroAgencia?: string; 
      nome?: string;  
    }
  };
}