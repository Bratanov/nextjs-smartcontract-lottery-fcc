import React from "react"
import { useMoralis, useWeb3Contract, provider, useChain } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"

const LotteryEntrance = () => {
    const { chainId: chainIdHex, isWeb3Enabled, enableWeb3, Moralis, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [entranceFee, setEntranceFee] = useState("0")
    const [numberOfPlayers, setNumberOfPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0x")

    const dispatch = useNotification()

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })

    // try to read the raffle entrance fee
    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    })
    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })
    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    async function updateUI() {
        const entranceFeeResult = await getEntranceFee({
            onError: console.error,
        })
        setEntranceFee(entranceFeeResult.toString())

        const numberOfPlayersResult = await getNumberOfPlayers({
            onError: console.error,
        })
        setNumberOfPlayers(numberOfPlayersResult.toString())

        const recentWinnerResult = await getRecentWinner({
            onError: console.error,
        })
        setRecentWinner(recentWinnerResult.toString())
    }

    useEffect(() => {
        if (isWeb3Enabled && raffleAddress) {
            updateUI()
        }
    }, [isWeb3Enabled])

    useEffect(() => {
        // subscribe for events
        if (isWeb3Enabled && raffleAddress) {
            const signer = web3.getSigner() // if this is for making transactions
            const contract = new ethers.Contract(raffleAddress, abi, signer)

            contract.removeAllListeners() // do I need to cleanup here, since it should be called only once?
            contract.on("RaffleEnter", (address, tx) => {
                console.log("Someone entered raffle, updating UI", address, tx)
                updateUI()
            })
            contract.on("WinnerPicked", (address, tx) => {
                console.log("Someone won the raffle, updating UI", address, tx)
                updateUI()
            })
        }
    }, [isWeb3Enabled])

    const handleSuccess = async (tx) => {
        console.log("tx", tx)
        await tx.wait(1)
        updateUI()
        handleNewNotification(tx)
    }

    const handleNewNotification = () => {
        dispatch({
            type: "info",
            message: "Transaction complete!",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <>
            <div className="p-5">LotteryEntrance ETH</div>
            {raffleAddress ? (
                <>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-2 py-4 rounded ml-auto"
                        onClick={async () =>
                            await enterRaffle({
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            })
                        }
                        disabled={isLoading || isFetching}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            <div>Enter Raffle!</div>
                        )}
                    </button>
                    <div>Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")}ETH </div>
                    <div>Number of Players: {numberOfPlayers}</div>
                    <div>Recent Winner: {recentWinner}</div>
                </>
            ) : (
                <div>No raffle address</div>
            )}
        </>
    )
}

export default LotteryEntrance
