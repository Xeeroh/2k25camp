import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { CHURCHES_DATA } from '@/lib/churches-data';

interface FormFieldsProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
  isSubmitting: boolean;
  emailExists: boolean;
  isCheckingEmail: boolean;
  sectorValue: string;
  shirtAvailable: boolean | null;
  checkingShirts: boolean;
}

export const PersonalInfoFields = ({ form, isLoading, isSubmitting, emailExists, isCheckingEmail }: FormFieldsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FormField
      control={form.control}
      name="firstName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre(s)</FormLabel>
          <FormControl>
            <Input 
              placeholder="Ingrese su nombre(s)" 
              {...field} 
              disabled={isLoading || isSubmitting}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={form.control}
      name="lastName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Apellido(s)</FormLabel>
          <FormControl>
            <Input 
              placeholder="Ingrese su apellido(s)" 
              {...field} 
              disabled={isLoading || isSubmitting}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Correo Electrónico</FormLabel>
          <div className="relative">
            <FormControl>
              <Input 
                type="email" 
                placeholder="correo@ejemplo.com" 
                {...field} 
                disabled={isLoading || isSubmitting}
                className={emailExists ? "pr-10 border-red-300" : ""}
              />
            </FormControl>
            {isCheckingEmail && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={form.control}
      name="phone"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Teléfono</FormLabel>
          <FormControl>
            <Input 
              type="tel" 
              placeholder="(123) 456-7890" 
              {...field}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                field.onChange(formatted);
              }}
              disabled={isLoading || isSubmitting}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

export const ChurchFields = ({ form, isLoading, isSubmitting, sectorValue }: FormFieldsProps) => {
  const filteredChurches = CHURCHES_DATA.filter(
    church => church.sector.toString() === sectorValue || 
              (sectorValue === "Foráneo" && church.sector === "Foráneo")
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="sector"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sector</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue("church", "");
              }}
              value={field.value}
              disabled={isLoading || isSubmitting}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un sector" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="Foráneo">Foráneo</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="church"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Iglesia</FormLabel>
            <Select 
              onValueChange={field.onChange}
              value={field.value}
              disabled={!sectorValue || isLoading || isSubmitting}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={
                    sectorValue 
                      ? "Seleccione una iglesia" 
                      : "Primero seleccione un sector"
                  } />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {filteredChurches.map((church) => (
                  <SelectItem 
                    key={`${church.sector}-${church.name}`} 
                    value={church.name}
                  >
                    {church.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export const ShirtField = ({ form, isLoading, isSubmitting, shirtAvailable, checkingShirts }: FormFieldsProps) => {
  if (shirtAvailable === false) {
    return (
      <div className="rounded-md border p-4 bg-amber-50">
        <p className="text-sm font-medium text-amber-800">
          Lo sentimos, ya no hay camisetas disponibles
        </p>
        <p className="text-xs text-amber-700 mt-1">
          Las camisetas eran limitadas para los primeros 100 asistentes y ya se han agotado.
        </p>
      </div>
    );
  }

  if (shirtAvailable === null || shirtAvailable) {
    return (
      <FormField
        control={form.control}
        name="tshirtsize"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Talla de Camiseta *
              {checkingShirts && (
                <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </FormLabel>
            <Select 
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoading || isSubmitting}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione su talla" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="XS">XS</SelectItem>
                <SelectItem value="S">S</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="XL">XL</SelectItem>
                <SelectItem value="XXL">XXL</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
            <p className="text-xs text-muted-foreground mt-1">
              {shirtAvailable === null
                ? "Cargando disponibilidad..."
                : "* Disponible para los primeros 100 asistentes *"
              }
            </p>
            <p className="text-xs text-blue-500 mt-1">
              Talla actual: {field.value || "No seleccionada"}
            </p>
          </FormItem>
        )}
      />
    );
  }

  return null;
};

const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
}; 