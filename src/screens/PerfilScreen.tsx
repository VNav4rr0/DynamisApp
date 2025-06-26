import React, { useState, useEffect } from 'react';

// --- Importações do Firebase ---
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut,
    signInAnonymously,
    signInWithCustomToken,
    Auth,
    User as FirebaseUser
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp,
    onSnapshot,
    Firestore
} from 'firebase/firestore';

// --- Ícones (usando Lucide React para a web) ---
import { 
    Bell, 
    BellOff, 
    Settings, 
    ArrowUpRight, 
    LogOut, 
    FileText, 
    Check, 
    Clock, 
    User, 
    Home, 
    BarChart2,
    LoaderCircle
} from 'lucide-react';


// --- Declaração dos tipos globais para variáveis injetadas ---
declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string | undefined;

// --- Configuração do Firebase ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Componente para injetar estilos globais (para a animação) ---
const GlobalStyles = () => (
    <style>{`
        @keyframes shake {
            10%, 90% { transform: rotate(-15deg); }
            20%, 80% { transform: rotate(15deg); }
            30%, 50%, 70% { transform: rotate(-15deg); }
            40%, 60% { transform: rotate(15deg); }
        }
        .animate-shake {
            animation: shake 0.5s ease-in-out;
        }
        @keyframes slide-up {
            from {
                transform: translate(-50%, 100%);
                opacity: 0;
            }
            to {
                transform: translate(-50%, 0);
                opacity: 1;
            }
        }
        .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
        }
    `}</style>
);


// --- Componentes Auxiliares (Definidos antes de serem usados) ---

type ScrollViewProps = {
    children: React.ReactNode;
    className?: string;
};

const ScrollView: React.FC<ScrollViewProps> = ({ children, className }) => (
    <div className={`overflow-y-auto ${className}`}>
        {children}
    </div>
);

type SwitchProps = {
    checked: boolean;
    onChange: () => void;
};

const Switch: React.FC<SwitchProps> = ({ checked, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#AEF359] focus:ring-offset-2 focus:ring-offset-black
            ${checked ? 'bg-green-700' : 'bg-gray-600'}`}
    >
        <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

const Divider = () => <div className="bg-gray-800 h-px mx-4" />;

type SettingsRowProps = {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children?: React.ReactNode;
};

const SettingsRow: React.FC<SettingsRowProps> = ({ icon, title, subtitle, children }) => (
    <div className="flex items-center p-3">
        {icon}
        <div className="flex-1 ml-4">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        {children}
    </div>
);

type ClickableRowProps = {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
};

const ClickableRow: React.FC<ClickableRowProps> = ({ icon, title, subtitle, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center p-3 hover:bg-gray-800/50 rounded-2xl transition-colors">
        {icon}
        <div className="flex-1 ml-4 text-left">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
        <ArrowUpRight size={20} className="text-gray-400" />
    </button>
);

type SnackbarProps = {
    isVisible: boolean;
    message: string;
};

const Snackbar: React.FC<SnackbarProps> = ({ isVisible, message }) => {
    if (!isVisible) return null;
    return (
        <div className="animate-slide-up fixed bottom-24 left-1/2 w-11/12 max-w-md bg-[#323232] text-white p-4 rounded-lg shadow-lg border-l-4 border-[#AEF359]">
            <p className="font-medium">{message}</p>
        </div>
    );
};

type BottomNavBarProps = {
    activeTab: string;
    setCurrentPage: (page: string) => void;
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, setCurrentPage }) => {
    const navItems = [
        { id: 'home', label: 'Home', icon: Home, page: 'Home' },
        { id: 'insights', label: 'Metas', icon: BarChart2, page: 'ProgressoDetalhado' },
        { id: 'person', label: 'Perfil', icon: User, page: 'Perfil' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative mx-auto max-w-sm h-16 bg-[#1C1C1E] rounded-full flex justify-around items-center">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentPage(item.page)}
                            className="relative z-10 flex-1 h-full flex justify-center items-center transition-colors"
                        >
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive ? 'bg-white text-black' : 'text-white'}`}>
                                <item.icon size={22} />
                                {isActive && <span className="font-bold text-sm">{item.label}</span>}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};


// --- Componente da Tela de Perfil ---
type ProfileScreenProps = {
    setCurrentPage: (page: string) => void;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ setCurrentPage }) => {
    // --- Estados do Firebase e do Usuário ---
    const [auth, setAuth] = useState<Auth | null>(null);
    const [db, setDb] = useState<Firestore | null>(null);
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState({ name: 'Carregando...', email: '...' });

    // --- Estados da UI ---
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [requestStatus, setRequestStatus] = useState('idle'); // 'idle', 'loading', 'pending', 'accepted'
    const [isSnackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [playBellAnimation, setPlayBellAnimation] = useState(false);

    // --- Inicialização do Firebase e Autenticação ---
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        
        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(authInstance, __initial_auth_token);
                    } else {
                        await signInAnonymously(authInstance);
                    }
                } catch (error) {
                    console.error("Erro na autenticação:", error);
                    setIsLoading(false);
                }
            }
        });
        
        return () => unsubscribe();
    }, []);
    
    // --- Efeito para buscar dados do usuário e solicitações ---
    useEffect(() => {
        if (user && db) {
            setIsLoading(true);
            const userRef = doc(db, `artifacts/${appId}/users`, user.uid);
            
            // Listener para dados do usuário
            const unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserData({ name: data.name, email: data.email });
                    setNotificationsEnabled(data.notificationsEnabled ?? true);
                } else {
                    const defaultUserData = {
                        name: user.displayName || 'Novo Usuário',
                        email: user.email || `anon_${user.uid.substring(0,6)}@email.com`,
                        notificationsEnabled: true,
                        createdAt: serverTimestamp()
                    };
                    await setDoc(userRef, defaultUserData);
                    setUserData({ name: defaultUserData.name, email: defaultUserData.email });
                }
            }, (error) => {
                console.error("Erro ao buscar dados do usuário:", error);
            });

            // Listener para solicitações ao nutricionista
            const requestsRef = collection(db, `artifacts/${appId}/public/data/requests`);
            const q = query(requestsRef, where("patientId", "==", user.uid));

            const unsubscribeRequests = onSnapshot(q, (querySnapshot) => {
                if (!querySnapshot.empty) {
                    const requestDoc = querySnapshot.docs[0].data();
                    setRequestStatus(requestDoc.status || 'pending'); // 'pending' ou 'accepted'
                } else {
                    setRequestStatus('idle');
                }
                setIsLoading(false);
            }, (error) => {
                console.error("Erro ao buscar solicitações:", error);
                setIsLoading(false);
            });
            
            return () => {
                unsubscribeUser();
                unsubscribeRequests();
            };
        }
    }, [user, db]);


    // --- Funções de Ação ---
    const handleToggleNotifications = async () => {
        if (!user || !db) return;
        
        const newStatus = !notificationsEnabled;
        setNotificationsEnabled(newStatus);
        
        if (newStatus) {
            setPlayBellAnimation(true);
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
            setTimeout(() => setPlayBellAnimation(false), 500);
        }

        const userRef = doc(db, `artifacts/${appId}/users`, user.uid);
        try {
            await updateDoc(userRef, { notificationsEnabled: newStatus });
            setSnackbarMessage(newStatus ? "Notificações ativadas!" : "Notificações desativadas.");
            setSnackbarVisible(true);
        } catch (error) {
            console.error("Erro ao atualizar notificação:", error);
            setSnackbarMessage("Erro ao salvar preferência.");
            setSnackbarVisible(true);
            setNotificationsEnabled(!newStatus);
        }
    };

    const handleSendRequest = async () => {
        if (!user || !db) return;

        setRequestStatus('loading');
        try {
            const requestsRef = collection(db, `artifacts/${appId}/public/data/requests`);
            await addDoc(requestsRef, {
                patientId: user.uid,
                patientName: userData.name,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            setSnackbarMessage("Sua solicitação foi enviada com sucesso!");
            setSnackbarVisible(true);
        } catch (error) {
            console.error("Erro ao enviar solicitação:", error);
            setRequestStatus('idle');
            setSnackbarMessage("Falha ao enviar solicitação.");
            setSnackbarVisible(true);
        }
    };
    
    const handleLogout = async () => {
        if(auth) {
            try {
                await signOut(auth);
                setUser(null);
                setUserData({ name: 'Usuário', email: 'Desconectado' });
                setCurrentPage('Login'); 
            } catch (error) {
                console.error("Erro ao fazer logout:", error);
            }
        }
    };

    // --- Efeito para o Snackbar ---
    useEffect(() => {
        if (isSnackbarVisible) {
            const timer = setTimeout(() => {
                setSnackbarVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isSnackbarVisible]);
    
    // --- Renderização do Chip de Solicitação ---
    const renderChipContent = () => {
        switch (requestStatus) {
            case 'loading':
                return <LoaderCircle className="animate-spin h-5 w-5 text-black" />;
            case 'pending':
                return (
                    <>
                        <Clock size={18} className="text-white" />
                        <span className="ml-2 font-bold text-white">Solicitação Pendente</span>
                    </>
                );
             case 'accepted':
                return (
                    <>
                        <Check size={18} className="text-black" />
                        <span className="ml-2 font-bold text-black">Nutri Conectado</span>
                    </>
                );
            default: // idle
                return (
                    <>
                        <Check size={18} className="text-black" />
                        <span className="ml-2 font-bold">Enviar Solicitação</span>
                    </>
                );
        }
    };

    if (isLoading && !user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <LoaderCircle className="h-12 w-12 animate-spin text-[#AEF359]" />
            </div>
        );
    }
    
    return (
        <div className="bg-black min-h-screen font-sans text-white relative flex flex-col">
            <ScrollView className="flex-grow px-6">
                {/* Cabeçalho */}
                <header className="pt-16 pb-8">
                    <h1 className="text-4xl font-bold">{userData.name}</h1>
                    <p className="text-gray-400 text-md mt-1">{userData.email}</p>
                </header>

                {/* Card de Opções */}
                <div className="bg-[#0C0C0C] rounded-3xl p-2 space-y-2">
                    <SettingsRow 
                        icon={
                            <div className={playBellAnimation ? 'animate-shake' : ''}>
                                {notificationsEnabled ? <Bell size={24} className="text-[#AEF359]" /> : <BellOff size={24} className="text-gray-400" />}
                            </div>
                        }
                        title="Notificação"
                        subtitle="Lembrete para não perder sequência"
                    >
                        <Switch checked={notificationsEnabled} onChange={handleToggleNotifications} />
                    </SettingsRow>
                    
                    <Divider />

                    <ClickableRow 
                        icon={<Settings size={24} className="text-gray-400" />}
                        title="Gerenciar Informações"
                        subtitle="Atualize seus dados pessoais"
                        onClick={() => setCurrentPage('GerenciarInformacoes')}
                    />
                </div>

                {/* Botão Sair */}
                <button onClick={handleLogout} className="w-full bg-red-800 hover:bg-red-700 transition-colors text-white font-bold py-4 rounded-3xl my-6">
                    Sair da Conta
                </button>
                
                {/* Seção Nutricionista */}
                <section className="mt-4 mb-32">
                    <h2 className="text-2xl font-bold">Meu Nutricionista</h2>
                    <p className="text-gray-400 mt-1 mb-5">Deixe seu app mais eficaz adicionando seu nutricionista.</p>
                    
                    <div className="bg-[#0C0C0C] rounded-3xl p-8 flex flex-col items-center text-center">
                        <FileText size={48} className="text-gray-300" />
                        <p className="text-lg font-medium mt-4 mb-6">Envie uma solicitação para seu nutricionista se conectar.</p>
                        
                        <button
                            onClick={handleSendRequest}
                            disabled={requestStatus !== 'idle'}
                            className={`flex items-center justify-center px-6 py-3 rounded-full transition-all duration-300 min-w-[200px] h-12
                                ${requestStatus === 'idle' ? 'bg-[#AEF359] text-black hover:bg-white' : ''}
                                ${requestStatus === 'loading' ? 'bg-[#AEF359] cursor-not-allowed' : ''}
                                ${requestStatus === 'pending' ? 'bg-gray-700 cursor-not-allowed' : ''}
                                ${requestStatus === 'accepted' ? 'bg-[#AEF359] cursor-not-allowed' : ''}
                            `}
                        >
                           {renderChipContent()}
                        </button>
                        
                         <button
                            onClick={() => setCurrentPage('Nutricionista')}
                            className="mt-4 text-sm text-[#AEF359] hover:underline"
                         >
                            Já é um nutricionista? Entre aqui.
                         </button>
                    </div>
                </section>
            </ScrollView>
            
            {/* Snackbar */}
            <Snackbar isVisible={isSnackbarVisible} message={snackbarMessage} />

            {/* Bottom Navbar */}
            <BottomNavBar activeTab="person" setCurrentPage={setCurrentPage} />
        </div>
    );
};

// --- Componente Principal da Aplicação ---
export default function App() {
    const [currentPage, setCurrentPage] = useState('Perfil');

    // Gerencia a página a ser exibida
    const renderPage = () => {
        switch (currentPage) {
            case 'Home':
                return <div className="h-screen w-full bg-black flex flex-col items-center justify-center"><h1 className="text-white text-2xl">Página Home</h1><button onClick={() => setCurrentPage('Perfil')} className="text-white mt-4 p-2 bg-gray-700 rounded-lg">Voltar para Perfil</button></div>;
            case 'ProgressoDetalhado':
                return <div className="h-screen w-full bg-black flex flex-col items-center justify-center"><h1 className="text-white text-2xl">Página de Metas</h1><button onClick={() => setCurrentPage('Perfil')} className="text-white mt-4 p-2 bg-gray-700 rounded-lg">Voltar para Perfil</button></div>;
            case 'GerenciarInformacoes':
                return <div className="h-screen w-full bg-black flex flex-col items-center justify-center"><h1 className="text-white text-2xl">Gerenciar Informações</h1><button onClick={() => setCurrentPage('Perfil')} className="text-white mt-4 p-2 bg-gray-700 rounded-lg">Voltar para Perfil</button></div>;
            case 'Nutricionista':
                return <div className="h-screen w-full bg-black flex flex-col items-center justify-center"><h1 className="text-white text-2xl">Página do Nutricionista</h1><button onClick={() => setCurrentPage('Perfil')} className="text-white mt-4 p-2 bg-gray-700 rounded-lg">Voltar para Perfil</button></div>;
            case 'Login':
                 return <div className="h-screen w-full bg-black flex flex-col items-center justify-center"><h1 className="text-white text-2xl">Página de Login</h1><button onClick={() => setCurrentPage('Perfil')} className="text-white mt-4 p-2 bg-gray-700 rounded-lg">Ir para Perfil (Simulação)</button></div>;
            case 'Perfil':
            default:
                return <ProfileScreen setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <>
            <GlobalStyles />
            {renderPage()}
        </>
    );
}
