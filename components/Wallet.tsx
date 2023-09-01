'use client'

import React, { useState, useEffect, Fragment } from 'react'
import SocialLogin from "@biconomy/web3-auth";
import { ethers, providers } from 'ethers';
import { ChainId } from '@biconomy/core-types';
import { BiconomySmartAccount, BiconomySmartAccountConfig } from '@biconomy/account';
import { bundler, paymaster } from '@/constants';
import Transfer from './Transfer';

const Wallet = () => {
  const [sdkRef, setSdkRef] = useState<SocialLogin | null>(null);
  const [interval, setInterval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<providers.Web3Provider>();
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccount>();

  const login = async () => {
    if (!sdkRef) {
      const sdk = new SocialLogin();
      await sdk.init({
        chainId: ethers.utils.hexValue(ChainId.POLYGON_MUMBAI).toString(),
        network: "testnet",
      });
      setSdkRef(sdk);
    }

    if (!sdkRef?.provider) {
      sdkRef?.showWallet();
      setInterval(true);
    } else {
      console.log("Hello");
    }
    
  };

  const setupSmartAccount = async () => {
    try {
      if (!sdkRef?.provider) return;
      sdkRef.hideWallet();
      setLoading(true);

      let web3Provider = new ethers.providers.Web3Provider(
        sdkRef.provider
      );
      setProvider(web3Provider);
      
      const config: BiconomySmartAccountConfig = {
        signer: web3Provider.getSigner(),
        chainId: ChainId.POLYGON_MUMBAI,
        bundler: bundler,
        paymaster: paymaster,
      };

      const smartAccount = new BiconomySmartAccount(config);
      await smartAccount.init();

      setSmartAccount(smartAccount);
    } catch(err) {
      console.log(err);
    }
    setLoading(false);
  };

  const logout = async () => {
    await sdkRef?.logout();
    sdkRef?.hideWallet();
    setProvider(undefined);
    setSmartAccount(undefined);
    setInterval(false);
  };

  useEffect(() => {
    let configLogin: NodeJS.Timeout | undefined;
    if (interval) {
      configLogin = setTimeout(() => {
        if (!!sdkRef?.provider) {
          setupSmartAccount();
          clearInterval(configLogin);
        }
      }, 1000);
    }
  }, [interval, sdkRef]);

  return (
    <Fragment>
      {/* Logout Button */}
      {smartAccount && (
        <button
          onClick={logout}
          className="absolute right-0 m-3 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-medium transition-all hover:from-green-500 hover:to-blue-600 "
        >
          Logout
        </button>
      )}

      <div className="m-auto flex h-screen flex-col items-center justify-center gap-10 bg-gray-950">
        <h1 className=" text-4xl text-gray-50 font-bold tracking-tight lg:text-5xl">
          Send ERC20 using ERC20
        </h1>

        {/* Login Button */}
        {!smartAccount && !loading && (
          <button
            onClick={login}
            className="mt-10 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-medium transition-colors hover:from-green-500 hover:to-blue-600"
          >
            Login
          </button>
        )}

        {/* Loading state */}
        {loading && <p>Loading account details...</p>}

        {smartAccount && (
          <Fragment>
            <Transfer smartAccount={smartAccount} />
          </Fragment>
        )}
      </div>
    </Fragment>
  );
}

export default Wallet
