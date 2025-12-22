import { useEffect, useState, useRef } from "react";
import {
  CForm,
  CFormInput,
  CFormCheck,
  CFormLabel,
  CAlert,
} from "@coreui/react";
import {
  citySearchEngine,
  type City,
  ESTADOS_COMPLETOS,
} from "../../data/cities";

const PHONE_PREFIX = "+55 ";

const formatBRPhone = (nationalDigits: string) => {
  const d = nationalDigits.replace(/\D/g, "").slice(0, 11);

  if (d.length === 0) return PHONE_PREFIX;
  if (d.length <= 2) return `${PHONE_PREFIX}(${d}`;
  if (d.length <= 7) {
    return `${PHONE_PREFIX}(${d.slice(0, 2)}) ${d.slice(2)}`;
  }
  if (d.length <= 11) {
    const isMobile = d.length >= 10;
    const mid = isMobile ? 7 : 6;
    return `${PHONE_PREFIX}(${d.slice(0, 2)}) ${d.slice(2, mid)}-${d.slice(
      mid
    )}`;
  }
  return `${PHONE_PREFIX}(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
};

const stripToNational = (valueWithPrefix: string) => {
  const digits = valueWithPrefix.replace(/\D/g, "");
  const withoutCC = digits.startsWith("55") ? digits.slice(2) : digits;
  return withoutCC;
};

const CityStateAutocomplete = ({
  value,
  onChange,
  onSelect,
  disabled,
  placeholder = "Digite sua cidade...",
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (cidade: string, estado: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<City[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState<string>("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowCustomInput(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    setIsTyping(true);
    setShowCustomInput(false);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (inputValue.length < 2) {
        setFilteredOptions([]);
        setIsOpen(false);
        setIsTyping(false);
        return;
      }

      const results = citySearchEngine.fuzzySearch(inputValue, 12);
      setFilteredOptions(results);

      setIsOpen(true);
      setIsTyping(false);
    }, 300);
  };

  const handleSelect = (city: City) => {
    onSelect(city.nome, city.estado_sigla);
    onChange(city.display);
    setIsOpen(false);
    setIsTyping(false);
    setShowCustomInput(false);
  };

  const handleCustomInput = () => {
    setShowCustomInput(true);
    setIsOpen(false);
    setCustomInput(value);
  };

  const handleCustomInputChange = (inputValue: string) => {
    setCustomInput(inputValue);
  };

  const handleCustomInputSubmit = () => {
    if (customInput.trim()) {
      onSelect(customInput.trim(), "Personalizado");
      onChange(customInput.trim());
      setShowCustomInput(false);
      setCustomInput("");
    }
  };

  const handleFocus = () => {
    if (value.length >= 2) {
      const results = citySearchEngine.fuzzySearch(value, 12);
      setFilteredOptions(results);
      setIsOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {!showCustomInput ? (
        <>
          <CFormInput
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={false}
            className="pr-10"
          />

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {isTyping ? (
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-2 text-gray-500 text-sm">
                  <div className="mb-2">Nenhuma cidade encontrada</div>
                  <button
                    type="button"
                    onClick={handleCustomInput}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Adicionar cidade personalizada
                  </button>
                </div>
              ) : (
                filteredOptions.map((city) => (
                  <div
                    key={city.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSelect(city)}
                  >
                    <div className="font-medium">{city.nome}</div>
                    <div className="text-sm text-gray-500">{city.estado}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <CFormInput
            type="text"
            value={customInput}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            placeholder="Digite o nome da sua cidade"
            disabled={disabled}
            autoFocus={true}
          />
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleCustomInputSubmit}
              disabled={disabled || !customInput.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                setCustomInput("");
              }}
              disabled={disabled}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const InvestmentValueSelect = ({
  value,
  onChange,
  disabled,
  placeholder = "Selecione um valor...",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const opcoesInvestimento = [
    { value: "", label: "Selecione" },
    { value: "2950000-5000000", label: "De R$ 2.950.000 a R$ 5.000.000" },
    { value: "acima-5-milhoes", label: "Acima de 5 milhões" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    const option = opcoesInvestimento.find((opt) => opt.value === value);
    return option ? option.label : "";
  };

  return (
    <div ref={wrapperRef} className="relative">
      <CFormInput
        ref={inputRef}
        type="text"
        value={getDisplayValue()}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={false}
        className="pr-10 cursor-pointer"
        readOnly
      />

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {opcoesInvestimento.map((opcao) => (
            <div
              key={opcao.value}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelect(opcao.value)}
            >
              <div className="font-medium">{opcao.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FormComponent = () => {
  const [data, setData] = useState({
    nome: "",
    email: "",
    telefone: PHONE_PREFIX,
    cidadeEstado: "",
    valorInvestimento: "",
    corretor: "Não",
    comunicacao: false,
  });

  const [errors, setErrors] = useState<{
    telefone?: string;
    submit?: string;
    nome?: string;
    email?: string;
    cidadeEstado?: string;
    valorInvestimento?: string;
    corretor?: string;
  }>({});

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const selectionStart = input.selectionStart ?? 0;

    if (
      (e.key === "Backspace" && selectionStart <= PHONE_PREFIX.length) ||
      (e.key === "Delete" && selectionStart < PHONE_PREFIX.length)
    ) {
      e.preventDefault();
      return;
    }

    const controlKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "Tab",
    ];
    if (controlKeys.includes(e.key)) return;

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    const next = val.startsWith(PHONE_PREFIX)
      ? val
      : PHONE_PREFIX + val.replace(/^\+?55\s?/, "");

    const national = stripToNational(next);
    const formatted = formatBRPhone(national);

    setData((prev) => ({ ...prev, telefone: formatted }));

    if (errors.telefone) {
      setErrors((prev) => ({ ...prev, telefone: undefined }));
    }
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const digits = pasted.replace(/\D/g, "");
    const withoutCC = digits.startsWith("55") ? digits.slice(2) : digits;
    const formatted = formatBRPhone(withoutCC);
    setData((prev) => ({ ...prev, telefone: formatted }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    setData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCidadeEstadoChange = (value: string) => {
    setData((prev) => ({ ...prev, cidadeEstado: value }));
    if (errors.cidadeEstado) {
      setErrors((prev) => ({ ...prev, cidadeEstado: undefined }));
    }
  };

  const handleCidadeEstadoSelect = (cidade: string, estado: string) => {
    if (estado === "Personalizado") {
      setData((prev) => ({
        ...prev,
        cidadeEstado: cidade,
        cidade: cidade,
        estado: "Não especificado",
      }));
    } else {
      const estadoCompleto = ESTADOS_COMPLETOS[estado] || estado;
      setData((prev) => ({
        ...prev,
        cidadeEstado: `${cidade} - ${estado}`,
        cidade: cidade,
        estado: estadoCompleto,
      }));
    }
  };

  const handleValorInvestimentoChange = (value: string) => {
    setData((prev) => ({ ...prev, valorInvestimento: value }));
    if (errors.valorInvestimento) {
      setErrors((prev) => ({ ...prev, valorInvestimento: undefined }));
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    const phoneDigits = data.telefone.replace(/\D/g, ""); // inclui 55
    // Exige ao menos 12 dígitos: 55 + DDD(2) + número (8/9)
    if (phoneDigits.length < 12) {
      newErrors.telefone =
        "Informe um telefone válido com DDD (ex.: +55 (82) 9XXXX-XXXX)";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      newErrors.email = "Email inválido";
    }

    if (data.nome.trim().length < 2) {
      newErrors.nome = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!data.cidadeEstado.trim()) {
      newErrors.cidadeEstado = "Selecione sua cidade";
    }

    if (!data.valorInvestimento) {
      newErrors.valorInvestimento = "Selecione um valor de investimento";
    }

    if (!data.corretor) {
      newErrors.corretor = "Selecione uma opção";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsLoading(true);

      try {
        const formElement = e.currentTarget as HTMLFormElement;
        const formData = new FormData(formElement);

        // 🔸 Captura dos valores UTM adicionados pelo UTMTracker
        const utm_source = (formData.get("utm_source") as string) || "";
        const utm_medium = (formData.get("utm_medium") as string) || "";
        const utm_campaign = (formData.get("utm_campaign") as string) || "";
        const utm_content = (formData.get("utm_content") as string) || "";
        const utm_term = (formData.get("utm_term") as string) || "";

        // 🔸 Seus dados existentes + os UTMs
        const payload = {
          ...data,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          utm_term,
          timestamp: new Date().toISOString(),
          source: "Bossa Eco Luxury Villas Landing Page",
        };

        const response = await fetch(
          "https://n8n-automacoes.yellowkite.cloud/webhook/8a7ac03c-20cb-4ef9-b77b-5e63a1b740fb",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ${response.status}`);
        }

        await response.text();
        setSubmitted(true);
        setData({
          nome: "",
          email: "",
          telefone: "",
          cidadeEstado: "",
          valorInvestimento: "",
          corretor: "",
          comunicacao: false,
        });
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          submit:
            error instanceof Error
              ? `Erro ao enviar formulário: ${error.message}`
              : "Erro desconhecido ao enviar formulário",
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <CForm
      onSubmit={handleSubmit}
      className="w-full max-w-2xl text-white space-y-6"
      id="forms"
    >
      <div>
        <CFormLabel htmlFor="nome">Nome *</CFormLabel>
        <CFormInput
          type="text"
          id="nome"
          name="nome"
          required
          value={data.nome}
          onChange={handleChange}
          autoFocus={false}
          disabled={isLoading}
        />
        {errors.nome && (
          <div className="text-danger text-sm mt-1">{errors.nome}</div>
        )}
      </div>

      <div>
        <CFormLabel htmlFor="email">Email *</CFormLabel>
        <CFormInput
          type="email"
          id="email"
          name="email"
          required
          value={data.email}
          onChange={handleChange}
          autoFocus={false}
          disabled={isLoading}
        />
        {errors.email && (
          <div className="text-danger text-sm mt-1">{errors.email}</div>
        )}
      </div>

      <div>
        <CFormLabel htmlFor="telefone">Telefone *</CFormLabel>
        <CFormInput
          type="tel"
          id="telefone"
          name="telefone"
          placeholder="+55"
          required
          value={data.telefone}
          onKeyDown={handlePhoneKeyDown}
          onChange={handlePhoneChange}
          onPaste={handlePhonePaste}
          autoFocus={false}
          disabled={isLoading}
        />
        {errors.telefone && (
          <div className="text-danger text-sm mt-1">{errors.telefone}</div>
        )}
      </div>

      <div>
        <CFormLabel htmlFor="cidadeEstado">Cidade *</CFormLabel>
        <CityStateAutocomplete
          value={data.cidadeEstado}
          onChange={handleCidadeEstadoChange}
          onSelect={handleCidadeEstadoSelect}
          disabled={isLoading}
          placeholder="Digite sua cidade..."
        />
        {errors.cidadeEstado && (
          <div className="text-danger text-sm mt-1">{errors.cidadeEstado}</div>
        )}
      </div>

      <div>
        <CFormLabel htmlFor="valorInvestimento">
          Qual valor deseja investir em sua casa em Milagres? *
        </CFormLabel>
        <InvestmentValueSelect
          value={data.valorInvestimento}
          onChange={handleValorInvestimentoChange}
          disabled={isLoading}
          placeholder="Selecione um valor..."
        />
        {errors.valorInvestimento && (
          <div className="text-danger text-sm mt-1">
            {errors.valorInvestimento}
          </div>
        )}
      </div>

      <div>
        <CFormLabel>Você é corretor de imóveis? *</CFormLabel>
        <div className="space-y-2 mt-2">
          <CFormCheck
            type="radio"
            id="corretor-sim"
            name="corretor"
            value="Sim"
            label="Sim"
            checked={data.corretor === "Sim"}
            onChange={handleChange}
            disabled={isLoading}
            autoFocus={false}
          />
          <CFormCheck
            type="radio"
            id="corretor-nao"
            name="corretor"
            value="Não"
            label="Não"
            checked={data.corretor === "Não"}
            onChange={handleChange}
            disabled={isLoading}
            autoFocus={false}
          />
        </div>
        {errors.corretor && (
          <div className="text-danger text-sm mt-1">{errors.corretor}</div>
        )}
      </div>

      <div className="mt-6">
        <CFormCheck
          type="checkbox"
          id="comunicacao"
          name="comunicacao"
          label="Eu concordo em receber comunicações."
          checked={data.comunicacao}
          onChange={handleChange}
          autoFocus={false}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-[#8d8b6f] text-white py-2 px-4 rounded hover:bg-[#8a886c] disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? "Enviando..." : "Saber mais!"}
      </button>

      {submitted && (
        <CAlert color="success" className="mt-4">
          Formulário enviado com sucesso! Entraremos em contato em breve.
        </CAlert>
      )}

      {errors.submit && (
        <CAlert color="danger" className="mt-4">
          {errors.submit}
        </CAlert>
      )}
    </CForm>
  );
};

export default FormComponent;
