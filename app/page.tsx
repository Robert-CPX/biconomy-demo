import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'

const Wallet = dynamic(() => import('@/components/Wallet'), { ssr: false });

const Home = () => {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <Wallet />
      </Suspense>
    </div>
  )
}

export default Home
