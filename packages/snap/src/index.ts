import type { OnTransactionHandler, OnHomePageHandler } from '@metamask/snaps-sdk';
import { panel, text, copyable, row, divider, address, heading } from '@metamask/snaps-sdk';

export type TransactionState = { 
  transactions: Array<any>,
  bookmarks: Array<any>
}; 

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
  transactionOrigin,
}) => {

  let data:TransactionState = await snap.request({
    method: "snap_manageState",
    params: { operation: "get" },
  }) as TransactionState || { transactions: [], bookmarks: [] };

  while(data.transactions.length > 9) { // magic number 
    data.transactions.pop(); 
  }

  data.transactions.unshift({
    transaction: transaction,
    chainId: chainId, 
    transactionOrigin: transactionOrigin
  }); 

  await snap.request({ 
    method: "snap_manageState",
    params: { operation: "update", newState: data }
  }); 

  let rows = []; 
  rows.push(row("Origin", text(`${transactionOrigin}`))); 
  rows.push(row("Chain ID", text(`${chainId}`))); 
  rows.push(row("From",address(`${transaction.from}`))); 
  if(transaction.to) rows.push(row("To",address(`${transaction.to}`))); 

  return {
    content: panel([
      heading("Transaction"),
      ...rows,
      text("Transaction data:"),
      copyable(JSON.stringify(transaction)),
    ]),
  };
};

export const onHomePage: OnHomePageHandler = async () => {
  const data:TransactionState = await snap.request({
    method: "snap_manageState",
    params: { operation: "get" },
  }) as TransactionState || { transactions: [], bookmarks: [] };
  if(data.transactions.length < 1) { 
    return { 
      content: panel([
        text("You have not initiated any transactions since installing this Snap. Your recent transaction requests will show up here.")
      ])
    }; 
  }
  let list = []; 
  for(let i = 0; i < data.transactions.length; i++) { 
    const tx = data.transactions[i]; 
    list.push(divider()); 
    list.push(row("Origin",text(tx.transactionOrigin))); 
    list.push(row("Chain ID",text(tx.chainId))); 
    list.push(row("From",address(`${tx.transaction.from}`))); 
    if(tx.transaction.to) list.push(row("To",address(`${tx.transaction.to}`))); 
    list.push(copyable(JSON.stringify(tx.transaction))); 
  }
  return { 
    content: panel([
      text(`Last ${data.transactions.length} transactions:`),
      ...list
    ])
  }; 
};
