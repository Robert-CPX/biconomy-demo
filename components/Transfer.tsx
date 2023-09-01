import { BiconomySmartAccount } from '@biconomy/account';
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { USDC_CONTRACT_ADDRESS, ERC20ABI } from '@/constants';
import { IHybridPaymaster, PaymasterMode, SponsorUserOperationDto } from '@biconomy/paymaster';

const Transfer = ({
  smartAccount
}:{
  smartAccount: BiconomySmartAccount
}) => {
  const [smartContractAddress, setsmartContractAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [recipient, setRecipient] = useState("");

  const getSmartContractAddress = async () => {
    const smartContractAddress = await smartAccount.getSmartAccountAddress();
    setsmartContractAddress(smartContractAddress);
  }

  useEffect(() => {
    getSmartContractAddress();
  }, []);

  const transfer = async () => {
    try {
      setIsLoading(true);
      // create an Ethers contract instance
      const readProvider = smartAccount.provider;
      const tokenContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20ABI, readProvider);

      // fetch the amount of decimals in the Contract
      const decimals = await tokenContract.decimals();
      // convert the amount to the smallest denomination
      const amountToSend = ethers.utils.parseUnits(amount.toString(), decimals);

      // create calldata for user operation
      const populatedTransferTxn = await tokenContract.populateTransaction.transfer(recipient, amountToSend);
      const calldata = populatedTransferTxn.data;

      //build the user operation
      const userOp = await smartAccount.buildUserOp([
        {
          to: USDC_CONTRACT_ADDRESS,
          data: calldata,
        }
      ]);

      //get the paymaster fee quote from biconomy
      const biconomyPaymaster = smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
      const feeQuoteResponse = await biconomyPaymaster.getPaymasterFeeQuotesOrData(userOp, {
        mode: PaymasterMode.ERC20,
        tokenList: [],
        preferredToken: USDC_CONTRACT_ADDRESS,
      });

      const feeQuote = feeQuoteResponse.feeQuotes;
      if (!feeQuote) throw new Error("Could not fetch fee quote in USDC");

      const spender = feeQuoteResponse.tokenPaymasterAddress || "";
      const selectedFeeQuote = feeQuote[0];

      //build the paymaster user operation
      let finalUserOp = await smartAccount.buildTokenPaymasterUserOp(userOp, {
        feeQuote: selectedFeeQuote,
        spender,
        maxApproval: true,
      });

      //get calldata for the paymaster
      const paymasterServiceData = {
        mode: PaymasterMode.ERC20,
        feeTokenAddress: USDC_CONTRACT_ADDRESS,
      };
      const paymasterAndDataResponse = await biconomyPaymaster.getPaymasterAndData(finalUserOp, paymasterServiceData);
      finalUserOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;

      //send the user operation
      const userOpResponse = await smartAccount.sendUserOp(finalUserOp);
      const receipt = await userOpResponse.wait();

      console.log(`Transaction receipt: ${JSON.stringify(receipt, null, 2)}`);
      window.alert('Transaction successful');
      setIsLoading(false);
    } catch(err) {
      console.log(err);
    }
  }

  return (
    <div>
      <p className="text-sm">
        {" "}
        Your smart account address is : {smartContractAddress}
      </p>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <p>Transfer tokens from your account to another :</p>
          <div className="mt-5  flex w-auto flex-col gap-2">
            <input
              className="rounded-xl border-2 p-1 text-gray-500"
              type="text"
              placeholder="Enter address"
              onChange={(e) => setRecipient(e.target.value)}
            />
            <input
              className="rounded-xl border-2 p-1 text-gray-500"
              type="number"
              placeholder="Enter amount"
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button
              className="w-32 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-medium transition-all hover:from-green-500 hover:to-blue-600"
              onClick={transfer}
            >
              Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transfer
