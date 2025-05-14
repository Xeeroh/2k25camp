'use client';

import * as React from 'react';
// Comentamos la importación de Recharts que podría estar causando el problema
// import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

// Versión simplificada temporalmente del ChartContainer
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ReactNode;
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn("flex aspect-video justify-center text-xs", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            Gráfico temporalmente deshabilitado.
            <br />
            Estamos trabajando para resolver un problema con la visualización.
          </p>
        </div>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'Chart';

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`
          )
          .join('\n'),
      }}
    />
  );
};

// Versiones simplificadas de los componentes
const ChartTooltip = ({ children }: { children?: React.ReactNode }) => {
  return <div>{children}</div>;
};

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
    active?: boolean;
    payload?: any[];
  }
>(
  (
    {
      active,
      payload,
      className,
    },
    ref
  ) => {
    return null; // Deshabilitado temporalmente
  }
);
ChartTooltipContent.displayName = 'ChartTooltip';

const ChartLegend = ({ children }: { children?: React.ReactNode }) => {
  return <div>{children}</div>;
};

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    hideIcon?: boolean;
    payload?: any[];
    verticalAlign?: 'top' | 'bottom';
    nameKey?: string;
  }
>(
  (props, ref) => {
    return null; // Deshabilitado temporalmente
  }
);
ChartLegendContent.displayName = 'ChartLegend';

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: any,
  key: string
) {
  if (!payload) {
    return null;
  }

  return config[key];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
};
