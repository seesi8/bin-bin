import Head from 'next/head'
import Image from 'next/image'
import { Rubik } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import {useState} from "react"

const rubik = Rubik({ subsets: ['latin'] })

function numberWithCommas(x) {
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixIndex = 0;

  while (x >= 1000 && suffixIndex < suffixes.length - 1) {
    x /= 1000;
    suffixIndex++;
  }

  const formattedNumber = x.toFixed(1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const number =  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${formattedNumber} ${suffixes[suffixIndex]}`;
}

export default function Home() {
  const [max, setMax] = useState(1000000)
  const [result, setResult] = useState([])
  const [load, setLoad] = useState(false)

  const handleClick = async () => {
    setLoad(true)
    const res = await fetch("https://api.hypixel.net/skyblock/auctions");

    const pages = (await res.json())["totalPages"]

    const least = {}
    const second = {}
    const total_item_count = {}
    let current_result = []
    

    for(var i =0; i < pages; i++){
      let page = await fetch(`https://api.hypixel.net/skyblock/auctions?page=${i}`);
      page = await page.json()

      for(let j = 0; j < page["auctions"].length; j++){
        const auction = page["auctions"][j]

        if(auction["bin"]){
          if(auction["item_name"] in total_item_count){
            total_item_count[auction["item_name"]] += 1
          }
          else{
            total_item_count[auction["item_name"]] = 1
          }
          if(auction["item_name"] in least){
            const prevLeast = least[auction["item_name"]]
            if(auction["starting_bid"] < prevLeast["starting_bid"]){
              least[auction["item_name"]] = auction
              second[auction["item_name"]] = prevLeast
            }
            else if((auction["item_name"] in second) && (auction["starting_bid"] < second[auction["item_name"]]["starting_bid"])){
              second[auction["item_name"]] = auction
            }
            else if(!(auction["item_name"] in second)){
              second[auction["item_name"]] = auction
            }
          }
          else{
            least[auction["item_name"]] = auction
          }

        }
      }
    }
    for(var name in least){
      if(!(name in second)){
        delete least[name]
      }
      else if(least[name]["starting_bid"] == second[name]["starting_bid"]){
        delete least[name]
        delete second[name]
      }
      else if(least[name]["starting_bid"] > max){
        delete least[name]
        delete second[name]
      }
      else if(total_item_count[name] < 10){
        delete least[name]
        delete second[name]
      }
      else{
        current_result.push({"name": name,"price_differential":second[name]["starting_bid"] - least[name]["starting_bid"] , "lower_price": least[name]["starting_bid"], "higher_price" : second[name]["starting_bid"], "lower_uuid": least[name]["uuid"], "amount_sold": total_item_count[name]})
      }
    }

    console.log(least)

    current_result.sort(function(first, second) {
      return second["price_differential"] - first["price_differential"];
    });

    setLoad(false)
    setResult(current_result)
  }

  return (
    <div className={rubik.className}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <h1>Input max</h1>
        <input type="number" value={max} onChange={(e) => {setMax(e.target.value)}} className={styles.input}/>
        <button className={styles.submit} onClick={handleClick}>submit</button>

        {
          !load ? 
          result.length > 0 ? 
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Buy For</th>
                <th>Sell For</th>
                <th>Profit</th>
                <th>Link</th>
                <th>Amount Being Sold</th>
              </tr>
            </thead>
            {result.map((item) => {
              return(
                <tr>
                  <td>{item["name"]}</td>
                  <td>{numberWithCommas(item["lower_price"])}</td>
                  <td>{numberWithCommas(item["higher_price"])}</td>
                  <td>{numberWithCommas(item["price_differential"])}</td>
                  <td>{"/viewauction " + item["lower_uuid"]}</td>
                  <td>{item["amount_sold"]}</td>
                </tr>
                )
              })
            }
          </table>
          :
          <></>
          : 
          <Image src="/loading.gif" width={200} height={200}/>
        }
        
      </main>
    </div>
  )
}
