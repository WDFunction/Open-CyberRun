import React, { useEffect, useRef, useState } from 'react'
import AdminLayout from './layout';
import G6, { Graph } from "@antv/g6";
import { useParams, useHistory } from 'react-router-dom'
import ReactDOM from 'react-dom'
import useSWR from 'swr';
import type { Level, LevelMap, Game } from '@cyberrun/core'
import instance from '../../components/instance';
import { Box, Popover, Button } from '@material-ui/core'

const MapPage = () => {
  const ref = useRef(null)
  const { id } = useParams<{ id: string }>()
  const { data, isValidating, mutate } = useSWR<{
    levels: Level[]
    maps: LevelMap[]
  }>(`/admin/games/${id}/maps`)
  const history = useHistory()
  const { data: gameData } = useSWR<Game>(`/admin/games/${id}`)
  const graph = useRef<Graph | null>(null)
  useEffect(() => {
    if (graph.current && !isValidating) {
      console.log(data)
      let render = {
        nodes: data?.levels.map(v => ({
          id: v._id.toString(),
          label: v.title,
          x: v.mapPoint?.x ?? 0,
          y: v.mapPoint?.y ?? 0,
          type: ["start", "end"].includes(v.type) ? "rect" :
            (v.type === "meta" ? "diamond" : "circle")
        })),
        edges: data?.maps.map(v => ({
          source: v.fromLevelId.toString(),
          target: v.toLevelId.toString(),
          style: {
            endArrow: true
          }
        }))
      }
      graph.current.data(render);
      graph.current.render();
    }

  }, [data, ref])

  const submitPosChange = (levelId: string, x: number, y: number) => {
    console.log(levelId, x, y)
    instance({
      url: `/admin/games/${id}/maps/${levelId}/mapPoint`,
      method: 'post',
      data: {
        x, y
      }
    })
  }

  const deleteLevel = async (id: string) => {
    setEditing('')
    await instance({
      url: `/admin/levels/${id}`,
      method: 'delete'
    })
    await mutate()
  }

  const editLevel = (levelId: string) => {
    history.push(`/admin/${id}/levels/${levelId}`)
    setEditing('')
  }

  useEffect(() => {
    if (!graph.current) {
      graph.current = new G6.Graph({
        // @ts-ignore
        container: ReactDOM.findDOMNode(ref!.current),
        height: 1080,
        width: 1920,
        defaultNode: {
          shape: "circle",
          size: [70],
          color: "#5B8FF9",
          style: {
            fill: "#9EC9FF",
            lineWidth: 3
          },
          labelCfg: {
            style: {
              fill: "#fff",
              fontSize: 20
            }
          }
        },
        defaultEdge: {
          style: {
            stroke: "#e2e2e2",
            lineWidth: 5
          }
        },
        modes: {
          default: ["drag-node"]
        },
        nodeStateStyles: {
          hover: {
            fill: "lightsteelblue"
          },
          click: {
            stroke: "#000",
            lineWidth: 3
          }
        },
        edgeStateStyles: {
          click: {
            stroke: "steelblue"
          }
        },
        layout: {
          preventOverlap: true,
          linkDistance: 200
        },
      });
      graph.current.on("click", (e) => {
        if (e.item) return;
        // add new
        console.log(e.canvasX, e.canvasY)
        instance({
          url: `/admin/levels`,
          method: 'post',
          data: { x: e.canvasX, y: e.canvasY, gameId: id }
        })
      });
      graph.current.on("node:click", (e) => {
        if (editingRef.current) {
          return;
        }
        setPosition({
          top: e.clientY, left: e.clientX
        })
        setEditing(e.item?.getID()!)
        editingRef.current = e.item?.getID()!
        setOpen(true)
      });
      graph.current.on("node:dragend", (e) => {
        console.log(e)
        // @ts-ignore
        submitPosChange(e.item?.getID(), e.item?.getBBox().centerX, e.item?.getBBox().centerY)
      })
    }
    graph.current.render();
  }, [])
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({
    top: 0, left: 0
  })
  const [editing, setEditing] = useState('')
  const editingRef = useRef('')
  return <AdminLayout>
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <img src={gameData?.map} style={{
        position: 'absolute', zIndex: -1,
        height: '100%', width: '100%'
      }}></img>
      <Popover anchorReference="anchorPosition" anchorPosition={position} open={open} onClose={() => {
        setEditing('')
        editingRef.current = ''
        setOpen(false)
      }} transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}>
        <Box p={2} onClick={() => {
          setOpen(false)
        }}>
          <Button>新增路径</Button>
          <Button onClick={() => editLevel(editing)}>编辑关卡</Button>
          <Button onClick={() => deleteLevel(editing)}>删除关卡</Button>
        </Box>
      </Popover>
    </div>
  </AdminLayout>
}

export default MapPage;