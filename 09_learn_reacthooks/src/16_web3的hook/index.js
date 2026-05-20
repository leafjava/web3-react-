/**
 * 自定义 Hook 示例入口文件
 * 
 * 导出所有自定义 Hook，方便在其他地方使用
 */

export { default as useWallet } from './useWallet';
export { default as useContractRead } from './useContractRead';
export { default as useTransaction } from './useTransaction';

/**
 * 使用示例：
 * 
 * import { useWallet, useContractRead, useTransaction } from './16';
 * 
 * function MyComponent() {
 *   const wallet = useWallet();
 *   const contractData = useContractRead({...});
 *   const transaction = useTransaction();
 *   
 *   // 使用这些 Hook
 * }
 */
