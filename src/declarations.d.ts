// Isto diz para o TypeScript: "Sempre que um arquivo terminar com .json,
// trate-o como um módulo que pode ser importado."
declare module '*.json' {
  const value: any;
  export default value;
}