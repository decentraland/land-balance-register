import React, { useState, useEffect, useCallback } from 'react'
import {
  Page,
  Container,
  Header,
  Segment,
  Radio,
  Loader,
  HeaderMenu,
  Button,
} from 'decentraland-ui'
import ethers, { Contract, BigNumber } from 'ethers'
import REGISTER_ABI from './abis/register.json'
import MINIME_ABI from './abis/miniMeToken.json'

import 'decentraland-ui/lib/styles.css'
import 'decentraland-ui/lib/dark-theme.css'
import './App.css'

const REGISTRY_ADDERSSES = {
  LAND: '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
  Estate: '0x959e104e1a4db6317fa58f8295f586e1a978c297',
}

const MINIME_TOKEN_ADDRESSES = {
  LANDMiniMeToken: '0x20dfe381ca71ade2582094cf569a8cb020af5ab1',
  EstateMiniMeToken: '0x8568f23f343694650370fe5e254b55bfb704a6c7',
}

export default function App() {
  const [account, setAccount] = useState<string>()
  const [landLoading, setLandLoading] = useState(true)
  const [estateLoading, setEstateLoading] = useState(true)
  const [landContract, setLandContract] = useState<Contract>()
  const [estateContract, setEstateContract] = useState<Contract>()
  const [landMinimeTokenContract, setLandMinimeTokenContract] = useState<
    Contract
  >()
  const [estateMinimeTokenContract, setEstateMinimeTokenContract] = useState<
    Contract
  >()
  const [isLandRegistered, setIsLandRegistered] = useState(false)
  const [isEstateRegistered, setIsEstateRegistered] = useState(false)
  const [landBalance, setLandBalance] = useState<BigNumber>()
  const [estateBalance, setEstateBalance] = useState<BigNumber>()
  const [estateLANDBalance, setEstateLandBalance] = useState<BigNumber>()
  const [landMinimeBalance, setLandMinimeBalance] = useState<BigNumber>()
  const [estateMinimeBalance, setEstateMinimeBalance] = useState<BigNumber>()

  let provider: ethers.providers.Web3Provider | null

  try {
    provider = new ethers.providers.Web3Provider((window as any).ethereum)
  } catch (e) {
    console.error('You need a wallet to enterr')
    provider = null
  }

  useEffect(() => {
    if (provider) {
      provider.send('eth_requestAccounts', []).then((accounts: string) => {
        setAccount(accounts[0])

        setLandContract(
          new Contract(
            REGISTRY_ADDERSSES.LAND,
            REGISTER_ABI,
            provider!.getSigner(0)
          )
        )

        setEstateContract(
          new Contract(
            REGISTRY_ADDERSSES.Estate,
            REGISTER_ABI,
            provider!.getSigner(0)
          )
        )

        setLandMinimeTokenContract(
          new Contract(
            MINIME_TOKEN_ADDRESSES.LANDMiniMeToken,
            MINIME_ABI,
            provider!.getSigner(0)
          )
        )

        setEstateMinimeTokenContract(
          new Contract(
            MINIME_TOKEN_ADDRESSES.EstateMiniMeToken,
            MINIME_ABI,
            provider!.getSigner(0)
          )
        )
      })
    }
  }, [provider])

  useEffect(() => {
    if (account && landContract && landMinimeTokenContract) {
      Promise.all([
        landContract.registeredBalance(account),
        landContract.balanceOf(account),
        landMinimeTokenContract.balanceOf(account),
      ])
        .then(
          ([isRegistered, balance, minimeBalance]: [
            boolean,
            BigNumber,
            BigNumber
          ]) => {
            setIsLandRegistered(isRegistered)
            setLandBalance(balance)
            setLandMinimeBalance(minimeBalance)
          }
        )
        .finally(() => setLandLoading(false))
    }
  }, [landContract, landMinimeTokenContract, account])

  useEffect(() => {
    if (account && estateContract && estateMinimeTokenContract) {
      Promise.all([
        estateContract.registeredBalance(account),
        estateContract.balanceOf(account),
        estateContract.getLANDsSize(account),
        estateMinimeTokenContract.balanceOf(account),
      ])
        .then(
          ([isRegistered, balance, estateLandBalance, minimeBalancec]: [
            boolean,
            BigNumber,
            BigNumber,
            BigNumber
          ]) => {
            setIsEstateRegistered(isRegistered)
            setEstateBalance(balance)
            setEstateLandBalance(estateLandBalance)
            setEstateMinimeBalance(minimeBalancec)
          }
        )
        .finally(() => setEstateLoading(false))
    }
  }, [estateContract, estateMinimeTokenContract, account])

  const registerBalance = useCallback(
    async (registry: string) => {
      const options =
        registry === 'LAND'
          ? {
              contract: landContract,
              isRegistered: isLandRegistered,
              setLoading: setLandLoading,
              setIsRegistered: setIsLandRegistered,
              token: landMinimeTokenContract,
              setBalance: setLandMinimeBalance,
            }
          : {
              contract: estateContract,
              isRegistered: isEstateRegistered,
              setLoading: setEstateLoading,
              setIsRegistered: setIsEstateRegistered,
              token: estateMinimeTokenContract,
              setBalance: setEstateMinimeBalance,
            }

      const method = options.isRegistered
        ? 'unregisterBalance'
        : 'registerBalance'

      options.setLoading(true)

      try {
        const tx = await options.contract![method]()
        await tx.wait(1)

        // If it was not registerred, set the balance
        if (!options.isRegistered) {
          const balance = await options.token!.balanceOf(account)
          options.setBalance(balance)
        }

        options.setIsRegistered(!options.isRegistered)
      } catch (e) {
        console.error(e.message)
      }

      options.setLoading(false)
    },
    [
      account,
      landContract,
      estateContract,
      isLandRegistered,
      isEstateRegistered,
      landMinimeTokenContract,
      estateMinimeTokenContract,
    ]
  )

  return (
    <Page isFullscreen>
      <Header size="huge" textAlign="center">
        LAND Balance Register
      </Header>
      {provider ? (
        <Container>
          <Segment style={{ maxWidth: 600 }}>
            <Loader size="mini" active={landLoading} />
            <HeaderMenu>
              <HeaderMenu.Left>
                <Header>{'LAND Balance'}</Header>
              </HeaderMenu.Left>
              <HeaderMenu.Right>
                <Radio
                  toggle
                  checked={isLandRegistered}
                  onChange={() => registerBalance('LAND')}
                  disabled={landLoading}
                  label={'Registered'}
                ></Radio>
              </HeaderMenu.Right>
            </HeaderMenu>
            <p>{`Balance: ${landBalance ? landBalance.toString() : 0} LAND`}</p>
            <p style={{ fontWeight: 'bold', fontSize: 18 }}>
              {`Voting Power: ${
                isLandRegistered && landMinimeBalance
                  ? `${100 * landMinimeBalance!.toNumber()} MANA`
                  : 'Land balance not registered'
              }`}
            </p>
          </Segment>

          <Segment style={{ maxWidth: 600 }}>
            <Loader size="mini" active={estateLoading} />
            <HeaderMenu>
              <HeaderMenu.Left>
                <Header>{'Estate LAND Balance'}</Header>
              </HeaderMenu.Left>
              <HeaderMenu.Right>
                <Radio
                  toggle
                  checked={isEstateRegistered}
                  onChange={() => registerBalance('Estate')}
                  disabled={estateLoading}
                  label={'Registered'}
                ></Radio>
              </HeaderMenu.Right>
            </HeaderMenu>
            <p>{`balance: ${
              estateBalance ? estateBalance.toString() : 0
            } EST`}</p>
            <p>{`Estate LAND balance: ${
              estateLANDBalance ? estateLANDBalance.toString() : 0
            } LAND`}</p>
            <p style={{ fontWeight: 'bold', fontSize: 18 }}>
              {`Voting Power: ${
                isEstateRegistered && estateMinimeBalance
                  ? `${100 * estateMinimeBalance!.toNumber()} MANA`
                  : 'Estate balance not registered'
              }`}
            </p>
          </Segment>

          <Button
            primary
            href="https://mainnet.aragon.org/#/dcl.eth/0x0741ab50b28ed40ed81acc1867cf4d57004c29b6/"
            target="blank"
          >
            {'Vote'}
          </Button>
        </Container>
      ) : (
        <p style={{ textAlign: 'center' }}>{'Wallet not found'}</p>
      )}
    </Page>
  )
}
