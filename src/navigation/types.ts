// DENTRO DE src/navigation/types.ts

export type AuthStackParamList = {
    BoasVindas: undefined;
    Login: undefined;
    CadastroInicial: undefined;
    RecuperarSenha: undefined;
    DefinirMetas: undefined;
    NutricionistaAccess: undefined;
    Nutricionista: { clientUid: string; clientName: string; };
};

export type MainTabParamList = {
    HomeTab: undefined;
    ProgressoDetalhadoTab: undefined;
    PerfilTab: undefined;
};

export type AppStackParamList = {
    MainTabs: undefined;
    GerenciarInformacoes: undefined;
};