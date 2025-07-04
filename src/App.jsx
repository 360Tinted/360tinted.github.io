import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Calendar, Clock, User, Mail, Phone, CheckCircle, Loader2 } from 'lucide-react'; // Adicionado Loader2 para o spinner
import './App.css';

// URL da API do seu backend
// IMPORTANTE: Altere para 'https://api.360tinted.com' DEPOIS que o subdomínio estiver configurado e funcionando no Render!
const API_BASE_URL = 'https://api.360tinted.com/api'; // Mudar para https://api.360tinted.com/api

function App() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(''); // Mudado para serviceId
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [services, setServices] = useState([]); // Agora os serviços serão carregados da API
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Mapeamento de serviços para exibir os nomes corretos no frontend (se necessário)
  // Se o backend já retornar os nomes corretos, este mapeamento pode ser simplificado ou removido
  const serviceDisplayMapping = {
    "carbon_doors_rear": { name: "Carbon Tinting Installation Doors and Rear window", price: "$199" },
    "carbon_windshield": { name: "Carbon Tinting Installation Windshield", price: "$150" },
    "carbon_full_car_windshield": { name: "Carbon Tinting Full car + Windshield", price: "$349" },
    "ceramic_doors_rear": { name: "Ceramic Tint Installation Doors and Rear window", price: "$299" },
    "ceramic_windshield": { name: "Ceramic Tinting Installation Windshield", price: "$250" },
    "ceramic_full_car_windshield": { name: "Ceramic Tinting Full car + Windshield", price: "$549" },
    "custom_tint_large_vehicles": { name: "Custom Tint Service – Large Vehicles / Panoramic Glass", price: "(Contact us)" },
    "tint_removal": { name: "Tint Removal", price: "(Contact us)" }, // Alterado para (Contact us)
    "windows_tint_installation_removal": { name: "Windows Tint Installation + Removal of old Tint", price: "(Contact us)" }
  };

  // Efeito para carregar serviços da API quando o componente monta
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        setError('');
        const response = await fetch(`${API_BASE_URL}/services`);
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again later.');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []); // Executa apenas uma vez ao montar o componente

  // Efeito para carregar horários disponíveis da API quando a data selecionada muda
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (selectedDate) {
        try {
          setLoadingTimes(true);
          setError('');
          const response = await fetch(`${API_BASE_URL}/available-times?date=${selectedDate}`);
          if (!response.ok) {
            throw new Error('Failed to fetch available times');
          }
          const data = await response.json();
          setAvailableTimes(data.available_times);
        } catch (err) {
          console.error('Error fetching available times:', err);
          setError('Failed to load available times. Please try again.');
          setAvailableTimes([]); // Limpa os horários em caso de erro
        } finally {
          setLoadingTimes(false);
        }
      } else {
        setAvailableTimes([]);
      }
    };
    fetchAvailableTimes();
  }, [selectedDate]); // Executa quando selectedDate muda

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedServiceId || !clientInfo.name || !clientInfo.email) {
      setError('Please fill in all required fields (Service, Date, Time, Name, Email).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: clientInfo.name,
          client_email: clientInfo.email,
          client_phone: clientInfo.phone || null,
          service_type: selectedServiceId, // Envia o service_key para o backend
          appointment_date: selectedDate,
          appointment_time: selectedTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appointment.');
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting appointment:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setClientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSelectedServiceId('');
    setClientInfo({ name: '', email: '', phone: '' });
    setIsSubmitted(false);
    setError('');
    setAvailableTimes([]);
    // Recarrega os serviços caso a lista tenha sido modificada no backend (opcional, mas bom para consistência)
    // fetchServices(); // Se quiser recarregar os serviços após cada agendamento
  };

  // Encontra o serviço selecionado para exibição
  const selectedServiceDetails = services.find(s => s.service_key === selectedServiceId);
  const serviceNameForDisplay = selectedServiceDetails ? selectedServiceDetails.name : (serviceDisplayMapping[selectedServiceId]?.name || 'N/A');
  const servicePriceForDisplay = selectedServiceDetails ? selectedServiceDetails.price : (serviceDisplayMapping[selectedServiceId]?.price || 'N/A');


  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento Confirmado!</h2>
              <p className="text-gray-600 mb-4">
                Seu agendamento foi realizado com sucesso. Você receberá um e-mail de confirmação em breve.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
                <p><strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('en-US')}</p> {/* Alterado para en-US */}
                <p><strong>Horário:</strong> {selectedTime}</p>
                <p><strong>Serviço:</strong> {serviceNameForDisplay} {servicePriceForDisplay}</p>
                <p><strong>Cliente:</strong> {clientInfo.name}</p>
                <p><strong>E-mail:</strong> {clientInfo.email}</p>
                {clientInfo.phone && <p><strong>Telefone:</strong> {clientInfo.phone}</p>}
              </div>
              <Button onClick={resetForm} className="w-full">
                Fazer Novo Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Agendamento Online</h1>
          <p className="text-xl text-gray-600">Agende sua consulta de forma rápida e fácil</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Seleção de Serviço e Data/Hora */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Selecione o Serviço e Horário
              </CardTitle>
              <CardDescription>
                Escolha o tipo de serviço e o horário desejado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seleção de Serviço */}
              <div>
                <Label htmlFor="service">Tipo de Serviço</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId} disabled={loadingServices}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingServices ? "Carregando serviços..." : "Selecione um serviço"} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.service_key} value={service.service_key}>
                        <div className="flex justify-between items-center w-full">
                          <span>{serviceDisplayMapping[service.service_key]?.name || service.name}</span>
                          <span className="text-sm text-gray-500 ml-2">{serviceDisplayMapping[service.service_key]?.price || service.price}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seleção de Data */}
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Seleção de Horário */}
              {selectedDate && (
                <div>
                  <Label htmlFor="time">Horário Disponível</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime} disabled={loadingTimes}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingTimes ? "Carregando horários..." : "Selecione um horário"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.length > 0 ? (
                        availableTimes.map(time => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {time}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-times" disabled>Nenhum horário disponível</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Suas Informações
              </CardTitle>
              <CardDescription>
                Preencha seus dados para confirmar o agendamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={clientInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={clientInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    value={clientInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo e Confirmação */}
        {selectedDate && selectedTime && selectedServiceId && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Resumo do Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Serviço</h4>
                  <p className="text-blue-700">{serviceNameForDisplay}</p>
                  <p className="text-sm text-blue-600">{servicePriceForDisplay}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900">Data</h4>
                  <p className="text-green-700">{new Date(selectedDate).toLocaleDateString('en-US')}</p> {/* Alterado para en-US */}
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900">Horário</h4>
                  <p className="text-purple-700">{selectedTime}</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={!clientInfo.name || !clientInfo.email || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
