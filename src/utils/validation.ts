// Utilitários de validação avançada

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validators = {
  // Validação de email
  email: (value: string): string | null => {
    if (!value) return 'Email é obrigatório';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email inválido';
    return null;
  },

  // Validação de telefone brasileiro
  phone: (value: string): string | null => {
    if (!value) return null;
    const phoneRegex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Telefone inválido';
    return null;
  },

  // Validação de CPF
  cpf: (value: string): string | null => {
    if (!value) return null;
    const cpf = value.replace(/\D/g, '');
    if (cpf.length !== 11) return 'CPF deve ter 11 dígitos';
    
    // Validação de CPF
    let sum = 0;
    let remainder;
    
    if (cpf === '00000000000') return 'CPF inválido';
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return 'CPF inválido';
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return 'CPF inválido';
    
    return null;
  },

  // Validação de CNPJ
  cnpj: (value: string): string | null => {
    if (!value) return null;
    const cnpj = value.replace(/\D/g, '');
    if (cnpj.length !== 14) return 'CNPJ deve ter 14 dígitos';
    
    // Validação de CNPJ
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return 'CNPJ inválido';
    
    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return 'CNPJ inválido';
    
    return null;
  },

  // Validação de número positivo
  positiveNumber: (value: number | string): string | null => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'Valor inválido';
    if (num < 0) return 'Valor deve ser positivo';
    return null;
  },

  // Validação de número inteiro positivo
  positiveInteger: (value: number | string): string | null => {
    const num = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(num)) return 'Valor inválido';
    if (num < 0) return 'Valor deve ser positivo';
    if (!Number.isInteger(num)) return 'Valor deve ser inteiro';
    return null;
  },

  // Validação de data
  date: (value: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Data inválida';
    return null;
  },

  // Validação de data futura
  futureDate: (value: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Data inválida';
    if (date < new Date()) return 'Data deve ser futura';
    return null;
  },

  // Validação de data passada
  pastDate: (value: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Data inválida';
    if (date > new Date()) return 'Data deve ser passada';
    return null;
  },

  // Validação de range de datas
  dateRange: (startDate: string, endDate: string): string | null => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Datas inválidas';
    if (start > end) return 'Data inicial deve ser anterior à data final';
    return null;
  },

  // Validação de string não vazia
  required: (value: any): string | null => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'Campo obrigatório';
    }
    return null;
  },

  // Validação de tamanho mínimo
  minLength: (value: string, min: number): string | null => {
    if (!value) return null;
    if (value.length < min) return `Mínimo de ${min} caracteres`;
    return null;
  },

  // Validação de tamanho máximo
  maxLength: (value: string, max: number): string | null => {
    if (!value) return null;
    if (value.length > max) return `Máximo de ${max} caracteres`;
    return null;
  },

  // Validação de URL
  url: (value: string): string | null => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'URL inválida';
    }
  },

  // Validação de senha forte
  strongPassword: (value: string): string | null => {
    if (!value) return 'Senha é obrigatória';
    if (value.length < 8) return 'Senha deve ter no mínimo 8 caracteres';
    if (!/[A-Z]/.test(value)) return 'Senha deve conter letra maiúscula';
    if (!/[a-z]/.test(value)) return 'Senha deve conter letra minúscula';
    if (!/[0-9]/.test(value)) return 'Senha deve conter número';
    if (!/[!@#$%^&*]/.test(value)) return 'Senha deve conter caractere especial';
    return null;
  },

  // Validação de confirmação de senha
  passwordMatch: (password: string, confirmation: string): string | null => {
    if (password !== confirmation) return 'Senhas não conferem';
    return null;
  },
};

// Função para validar múltiplos campos
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ((value: any) => string | null)[]>
): ValidationResult => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    const value = data[field];

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Máscaras de formatação
export const masks = {
  cpf: (value: string): string => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  },

  cnpj: (value: string): string => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  },

  phone: (value: string): string => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  },

  cep: (value: string): string => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  },

  currency: (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  },

  number: (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('pt-BR').format(num);
  },
};
